from app.database.db import get_db
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    @staticmethod
    async def get_daily_active_users(days: int = 30) -> list:
        """Get daily active users"""
        db = await get_db()
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
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
        """Get weekly active users"""
        db = await get_db()
        
        cutoff_date = datetime.utcnow() - timedelta(weeks=weeks)
        
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": {"$week": "$created_at"},
                "users": {"$addToSet": "$user_id"}
            }},
            {"$project": {
                "week": {"$concat": ["Week ", {"$toString": "$_id"}]},
                "active_users": {"$size": "$users"},
                "_id": 0
            }}
        ]
        
        result = await db["quiz_sessions"].aggregate(pipeline).to_list(length=None)
        return result or []
    
    @staticmethod
    async def get_questions_served() -> dict:
        """Get total questions served"""
        db = await get_db()
        
        total = await db["responses"].count_documents({})
        today_responses = await db["responses"].count_documents({
            "answer_submitted_at": {
                "$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            }
        })
        
        sessions = await db["quiz_sessions"].count_documents({})
        avg_per_session = int(total / sessions) if sessions > 0 else 0
        
        return {
            "total_questions_served": total,
            "total_today": today_responses,
            "average_per_session": avg_per_session
        }
    
    @staticmethod
    async def get_questions_answered() -> dict:
        """Get total questions answered"""
        db = await get_db()
        
        total = await db["responses"].count_documents({})
        correct = await db["responses"].count_documents({"is_correct": True})
        incorrect = total - correct
        accuracy = (correct / total * 100) if total > 0 else 0
        
        return {
            "total_answered": total,
            "correct": correct,
            "incorrect": incorrect,
            "accuracy": round(accuracy, 2)
        }
    
    @staticmethod
    async def get_avg_response_time() -> dict:
        """Get average response time"""
        db = await get_db()
        
        pipeline = [
            {"$group": {
                "_id": None,
                "avg_time": {"$avg": "$response_duration_ms"},
                "median_time": {"$avg": "$response_duration_ms"},
                "max_time": {"$max": "$response_duration_ms"}
            }}
        ]
        
        result = await db["responses"].aggregate(pipeline).to_list(length=1)
        
        if result:
            return {
                "average_response_time_ms": int(result[0]["avg_time"]),
                "median_response_time_ms": int(result[0]["median_time"]),
                "p95_response_time_ms": int(result[0]["max_time"])
            }
        
        return {
            "average_response_time_ms": 0,
            "median_response_time_ms": 0,
            "p95_response_time_ms": 0
        }
    
    @staticmethod
    async def get_completion_rate() -> dict:
        """Get quiz completion rate"""
        db = await get_db()
        
        total = await db["quiz_sessions"].count_documents({})
        completed = await db["quiz_sessions"].count_documents({"status": "completed"})
        abandoned = total - completed
        rate = (completed / total * 100) if total > 0 else 0
        
        return {
            "total_sessions": total,
            "completed_sessions": completed,
            "abandoned_sessions": abandoned,
            "completion_rate_percent": round(rate, 2)
        }
    
    @staticmethod
    async def get_drop_off_analysis() -> list:
        """Get drop-off analysis by question number"""
        db = await get_db()
        
        pipeline = [
            {"$group": {
                "_id": "$session_id",
                "total_questions": {"$max": "$current_question_index"},
                "responses": {"$push": {"question_id": "$question_id"}}
            }},
            {"$sort": {"_id": 1}}
        ]
        
        # Simple drop-off calculation
        sessions = await db["quiz_sessions"].find({}).to_list(length=None)
        results = []
        
        if sessions:
            for idx in range(1, 11):
                sessions_with_idx = [s for s in sessions if s.get("current_question_index", 0) >= idx]
                drop_off = 0 if len(sessions) == 0 else ((len(sessions) - len(sessions_with_idx)) / len(sessions) * 100)
                
                results.append({
                    "question_number": idx,
                    "users_reached": len(sessions_with_idx),
                    "users_answered": len([s for s in sessions if s.get("current_question_index", 0) > idx]),
                    "drop_off_percent": round(drop_off, 2)
                })
        
        return results
    
    @staticmethod
    async def get_peak_hours() -> list:
        """Get peak activity hours"""
        db = await get_db()
        
        pipeline = [
            {"$group": {
                "_id": {"$hour": "$created_at"},
                "activity": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}},
            {"$project": {
                "hour": "$_id",
                "activity": 1,
                "_id": 0
            }}
        ]
        
        result = await db["quiz_sessions"].aggregate(pipeline).to_list(length=None)
        
        # Fill missing hours with 0
        hours_dict = {item["hour"]: item["activity"] for item in result}
        full_result = [
            {"hour": h, "activity": hours_dict.get(h, 0)}
            for h in range(24)
        ]
        
        return full_result
    
    @staticmethod
    async def get_avg_questions_per_session() -> dict:
        """Get average questions per session"""
        db = await get_db()
        
        pipeline = [
            {"$group": {
                "_id": None,
                "avg_questions": {"$avg": "$total_questions"},
                "min_questions": {"$min": "$total_questions"},
                "max_questions": {"$max": "$total_questions"}
            }}
        ]
        
        result = await db["quiz_sessions"].aggregate(pipeline).to_list(length=1)
        
        if result:
            return {
                "average_questions": round(result[0]["avg_questions"], 2),
                "min_questions": result[0]["min_questions"],
                "max_questions": result[0]["max_questions"]
            }
        
        return {
            "average_questions": 0,
            "min_questions": 0,
            "max_questions": 0
        }
