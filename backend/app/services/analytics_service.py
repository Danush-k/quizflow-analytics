"""
AnalyticsService — all metrics for the SkillBytes analytics dashboard.

Design principles:
  - Pure MongoDB aggregation pipelines wherever possible (no Python-level loops on large datasets)
  - IST (+05:30) timezone awareness for all date/time groupings
  - Each method is independently callable for individual dashboard cards
  - `get_overview()` aggregates the most critical KPIs in a single round-trip
"""
from app.database.db import get_db
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:

    # ─────────────────────────────────────────────────────────────
    # Overview — single aggregated call for dashboard header cards
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_overview() -> dict:
        """
        Returns a single aggregated snapshot of the most important KPIs.
        Designed for the dashboard header: reduces 6+ individual API calls to 1.
        """
        db = await get_db()

        total_users     = await db["users"].count_documents({})
        total_sessions  = await db["quiz_sessions"].count_documents({})
        completed       = await db["quiz_sessions"].count_documents({"status": "completed"})
        total_responses = await db["responses"].count_documents({})
        correct         = await db["responses"].count_documents({"is_correct": True})

        completion_rate = round((completed / total_sessions * 100), 2) if total_sessions > 0 else 0
        overall_accuracy = round((correct / total_responses * 100), 2) if total_responses > 0 else 0

        # Average response time
        rt_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$response_duration_ms"}}}]
        rt_result = await db["responses"].aggregate(rt_pipeline).to_list(1)
        avg_rt = int(rt_result[0]["avg"]) if rt_result else 0

        # Peak hour (IST) in the last 24 hours
        cutoff_date_24h = datetime.utcnow() - timedelta(hours=24)
        peak_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date_24h}}},
            {"$group": {
                "_id": {"$hour": {"date": "$created_at", "timezone": "+05:30"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        peak_result = await db["quiz_sessions"].aggregate(peak_pipeline).to_list(1)
        peak_hour = peak_result[0]["_id"] if peak_result else None

        # Top subject by activity
        subj_pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$lookup": {"from": "chapters", "localField": "q.chapter_id",
                         "foreignField": "chapter_id", "as": "c"}},
            {"$unwind": "$c"},
            {"$lookup": {"from": "subjects", "localField": "c.subject_id",
                         "foreignField": "subject_id", "as": "s"}},
            {"$unwind": "$s"},
            {"$group": {"_id": "$s.name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        subj_result = await db["responses"].aggregate(subj_pipeline).to_list(1)
        top_subject = subj_result[0]["_id"] if subj_result else None

        return {
            "total_users": total_users,
            "total_sessions": total_sessions,
            "completed_sessions": completed,
            "completion_rate_percent": completion_rate,
            "total_questions_served": total_responses,
            "total_responses": total_responses,
            "overall_accuracy": overall_accuracy,
            "avg_response_time_ms": avg_rt,
            "peak_hour": peak_hour,
            "top_subject": top_subject,
        }

    # ─────────────────────────────────────────────────────────────
    # Active Users
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_daily_active_users(days: int = 30) -> list:
        """
        Unique users who started at least one quiz session per day (IST).
        Uses $addToSet to deduplicate users within each day.
        """
        db = await get_db()
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": {"$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": "$created_at",
                    "timezone": "+05:30"
                }},
                "users": {"$addToSet": "$user_id"}
            }},
            {"$project": {
                "date": "$_id",
                "active_users": {"$size": "$users"},
                "_id": 0
            }},
            {"$sort": {"date": 1}}
        ]

        result = await db["quiz_sessions"].aggregate(pipeline).to_list(length=None)
        return result or []

    @staticmethod
    async def get_weekly_active_users(weeks: int = 4) -> list:
        """
        Unique users active per calendar week (IST).
        Groups by ISO week number.
        """
        db = await get_db()
        cutoff_date = datetime.utcnow() - timedelta(weeks=weeks)

        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": {"$week": {"date": "$created_at", "timezone": "+05:30"}},
                "users": {"$addToSet": "$user_id"}
            }},
            {"$project": {
                "week": {"$concat": ["Week ", {"$toString": "$_id"}]},
                "active_users": {"$size": "$users"},
                "_id": 0
            }},
            {"$sort": {"week": 1}}
        ]

        result = await db["quiz_sessions"].aggregate(pipeline).to_list(length=None)
        return result or []

    # ─────────────────────────────────────────────────────────────
    # Questions & Responses
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_questions_served() -> dict:
        """
        Total questions displayed to users.
        Each document in the responses collection = one question served.
        """
        db = await get_db()

        total = await db["responses"].count_documents({})
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today = await db["responses"].count_documents({
            "answer_submitted_at": {"$gte": today_start}
        })
        sessions = await db["quiz_sessions"].count_documents({})
        avg_per_session = int(total / sessions) if sessions > 0 else 0

        return {
            "total_questions_served": total,
            "total_today": today,
            "average_per_session": avg_per_session,
        }

    @staticmethod
    async def get_questions_answered() -> dict:
        """
        Correct vs incorrect response breakdown with overall accuracy rate.
        """
        db = await get_db()

        total   = await db["responses"].count_documents({})
        correct = await db["responses"].count_documents({"is_correct": True})
        accuracy = round((correct / total * 100), 2) if total > 0 else 0

        return {
            "total_answered": total,
            "correct": correct,
            "incorrect": total - correct,
            "accuracy": accuracy,
        }

    # ─────────────────────────────────────────────────────────────
    # Response Time
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_avg_response_time() -> dict:
        """
        Average and approximate median per-question response time.

        Note: True median requires $percentile (MongoDB 7.0+).
        For compatibility, median is approximated via a sort-based approach
        on a sampled window. p95 uses $max over the full collection.
        """
        db = await get_db()

        pipeline = [
            {"$group": {
                "_id": None,
                "avg_time": {"$avg": "$response_duration_ms"},
                "max_time": {"$max": "$response_duration_ms"},
                "count":    {"$sum": 1}
            }}
        ]
        result = await db["responses"].aggregate(pipeline).to_list(1)

        if not result:
            return {"average_response_time_ms": 0, "median_response_time_ms": 0, "p95_response_time_ms": 0}

        avg = int(result[0]["avg_time"])
        p95 = int(result[0]["max_time"])

        # Approximate median: fetch the middle document by sort
        total_count = result[0]["count"]
        median_pipeline = [
            {"$sort": {"response_duration_ms": 1}},
            {"$skip": total_count // 2},
            {"$limit": 1},
            {"$project": {"response_duration_ms": 1}}
        ]
        median_result = await db["responses"].aggregate(median_pipeline).to_list(1)
        median = int(median_result[0]["response_duration_ms"]) if median_result else avg

        return {
            "average_response_time_ms": avg,
            "median_response_time_ms": median,
            "p95_response_time_ms": p95,
        }

    # ─────────────────────────────────────────────────────────────
    # Sessions
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_completion_rate() -> dict:
        """
        Ratio of completed sessions to total sessions.
        Completed = status 'completed'; everything else is considered abandoned.
        """
        db = await get_db()

        total     = await db["quiz_sessions"].count_documents({})
        completed = await db["quiz_sessions"].count_documents({"status": "completed"})
        rate      = round((completed / total * 100), 2) if total > 0 else 0

        return {
            "total_sessions": total,
            "completed_sessions": completed,
            "abandoned_sessions": total - completed,
            "completion_rate_percent": rate,
        }

    @staticmethod
    async def get_drop_off_analysis() -> list:
        """
        Drop-off funnel: how many users reached and answered each question number.

        Uses a pure MongoDB aggregation pipeline to avoid loading all sessions
        into Python memory. Groups sessions by current_question_index to build
        a funnel from question 1 to 10.
        """
        db = await get_db()

        total = await db["quiz_sessions"].count_documents({})
        if total == 0:
            return []

        pipeline = [
            {"$group": {
                "_id": "$current_question_index",
                "sessions_at_index": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]

        index_counts = await db["quiz_sessions"].aggregate(pipeline).to_list(length=None)
        index_map = {item["_id"]: item["sessions_at_index"] for item in index_counts}

        results = []
        for q in range(1, 11):
            # Users who reached question q = sessions where index >= q
            reached = sum(v for k, v in index_map.items() if k >= q)
            answered = sum(v for k, v in index_map.items() if k > q)
            drop_off = round(((total - reached) / total * 100), 2) if total > 0 else 0

            results.append({
                "question_number": q,
                "users_reached": reached,
                "users_answered": answered,
                "drop_off_percent": drop_off,
            })

        return results

    @staticmethod
    async def get_peak_hours() -> list:
        """
        Session start activity grouped by hour of day (IST) in the last 24 hours.
        Returns all 24 hours — hours with no activity get count 0.
        """
        db = await get_db()
        cutoff_date = datetime.utcnow() - timedelta(hours=24)

        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": {"$hour": {"date": "$created_at", "timezone": "+05:30"}},
                "activity": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$project": {"hour": "$_id", "activity": 1, "_id": 0}}
        ]

        result = await db["quiz_sessions"].aggregate(pipeline).to_list(length=None)
        hours_dict = {item["hour"]: item["activity"] for item in result}

        return [{"hour": h, "activity": hours_dict.get(h, 0)} for h in range(24)]

    @staticmethod
    async def get_avg_questions_per_session() -> dict:
        """Average, min, and max questions answered per quiz session."""
        db = await get_db()

        pipeline = [
            {"$project": {
                "answers_count": {"$size": {"$ifNull": ["$answers", []]}}
            }},
            {"$group": {
                "_id": None,
                "avg_questions": {"$avg": "$answers_count"},
                "min_questions": {"$min": "$answers_count"},
                "max_questions": {"$max": "$answers_count"},
            }}
        ]

        result = await db["quiz_sessions"].aggregate(pipeline).to_list(1)
        if result:
            return {
                "average_questions": round(result[0]["avg_questions"], 2),
                "min_questions": result[0]["min_questions"],
                "max_questions": result[0]["max_questions"],
            }
        return {"average_questions": 0, "min_questions": 0, "max_questions": 0}

    # ─────────────────────────────────────────────────────────────
    # Served counts — by subject / chapter / exam / difficulty
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_subject_served_counts() -> list:
        """Questions served grouped by subject (3-way $lookup: response→question→chapter→subject)."""
        db = await get_db()
        pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$lookup": {"from": "chapters", "localField": "q.chapter_id",
                         "foreignField": "chapter_id", "as": "c"}},
            {"$unwind": "$c"},
            {"$lookup": {"from": "subjects", "localField": "c.subject_id",
                         "foreignField": "subject_id", "as": "s"}},
            {"$unwind": "$s"},
            {"$group": {"_id": "$s.name", "count": {"$sum": 1}}},
            {"$project": {"subject": "$_id", "count": 1, "_id": 0}},
            {"$sort": {"count": -1}}
        ]
        return await db["responses"].aggregate(pipeline).to_list(length=None) or []

    @staticmethod
    async def get_chapter_served_counts() -> list:
        """Questions served grouped by chapter."""
        db = await get_db()
        pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$lookup": {"from": "chapters", "localField": "q.chapter_id",
                         "foreignField": "chapter_id", "as": "c"}},
            {"$unwind": "$c"},
            {"$group": {"_id": "$c.name", "count": {"$sum": 1}}},
            {"$project": {"chapter": "$_id", "count": 1, "_id": 0}},
            {"$sort": {"count": -1}}
        ]
        return await db["responses"].aggregate(pipeline).to_list(length=None) or []

    @staticmethod
    async def get_exam_served_counts() -> list:
        """Questions served grouped by exam (4-way $lookup)."""
        db = await get_db()
        pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$lookup": {"from": "chapters", "localField": "q.chapter_id",
                         "foreignField": "chapter_id", "as": "c"}},
            {"$unwind": "$c"},
            {"$lookup": {"from": "subjects", "localField": "c.subject_id",
                         "foreignField": "subject_id", "as": "s"}},
            {"$unwind": "$s"},
            {"$lookup": {"from": "exams", "localField": "s.exam_id",
                         "foreignField": "exam_id", "as": "e"}},
            {"$unwind": "$e"},
            {"$group": {"_id": "$e.name", "count": {"$sum": 1}}},
            {"$project": {"exam": "$_id", "count": 1, "_id": 0}},
            {"$sort": {"count": -1}}
        ]
        return await db["responses"].aggregate(pipeline).to_list(length=None) or []

    @staticmethod
    async def get_difficulty_served_counts() -> list:
        """Questions served grouped by difficulty level (easy/medium/hard)."""
        db = await get_db()
        pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$group": {"_id": "$q.difficulty", "count": {"$sum": 1}}},
            {"$project": {"difficulty": "$_id", "count": 1, "_id": 0}},
            {"$sort": {"count": -1}}
        ]
        return await db["responses"].aggregate(pipeline).to_list(length=None) or []

    # ─────────────────────────────────────────────────────────────
    # Accuracy — by subject / chapter
    # ─────────────────────────────────────────────────────────────

    @staticmethod
    async def get_subject_accuracy() -> list:
        """
        Correct vs incorrect breakdown per subject.
        Uses $cond in $group to count correct answers without a second query.
        """
        db = await get_db()
        pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$lookup": {"from": "chapters", "localField": "q.chapter_id",
                         "foreignField": "chapter_id", "as": "c"}},
            {"$unwind": "$c"},
            {"$lookup": {"from": "subjects", "localField": "c.subject_id",
                         "foreignField": "subject_id", "as": "s"}},
            {"$unwind": "$s"},
            {"$group": {
                "_id": "$s.name",
                "total":   {"$sum": 1},
                "correct": {"$sum": {"$cond": [{"$eq": ["$is_correct", True]}, 1, 0]}}
            }},
            {"$project": {
                "subject":   "$_id",
                "total":     1,
                "correct":   1,
                "incorrect": {"$subtract": ["$total", "$correct"]},
                "accuracy":  {"$round": [{"$multiply": [{"$divide": ["$correct", "$total"]}, 100]}, 2]},
                "_id":       0
            }},
            {"$sort": {"accuracy": -1}}
        ]
        return await db["responses"].aggregate(pipeline).to_list(length=None) or []

    @staticmethod
    async def get_chapter_accuracy() -> list:
        """
        Correct vs incorrect breakdown per chapter.
        Sorted descending by accuracy to surface strongest and weakest chapters.
        """
        db = await get_db()
        pipeline = [
            {"$lookup": {"from": "questions", "localField": "question_id",
                         "foreignField": "question_id", "as": "q"}},
            {"$unwind": "$q"},
            {"$lookup": {"from": "chapters", "localField": "q.chapter_id",
                         "foreignField": "chapter_id", "as": "c"}},
            {"$unwind": "$c"},
            {"$group": {
                "_id": "$c.name",
                "total":   {"$sum": 1},
                "correct": {"$sum": {"$cond": [{"$eq": ["$is_correct", True]}, 1, 0]}}
            }},
            {"$project": {
                "chapter":   "$_id",
                "total":     1,
                "correct":   1,
                "incorrect": {"$subtract": ["$total", "$correct"]},
                "accuracy":  {"$round": [{"$multiply": [{"$divide": ["$correct", "$total"]}, 100]}, 2]},
                "_id":       0
            }},
            {"$sort": {"accuracy": -1}}
        ]
        return await db["responses"].aggregate(pipeline).to_list(length=None) or []
