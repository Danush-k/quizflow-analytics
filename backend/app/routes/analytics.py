"""
Analytics routes — 14 metrics endpoints + a single /overview aggregation.

All endpoints wrap responses in a consistent envelope:
  { "success": bool, "data": ..., "timestamp": ISO8601 }
"""
from fastapi import APIRouter, HTTPException, Query
from app.services.analytics_service import AnalyticsService
from app.models.analytics import (
    AnalyticsOverview, DailyActiveUsers, WeeklyActiveUsers,
    QuestionsServed, QuestionsAnswered, AvgResponseTime,
    CompletionRate, DropOffPoint, PeakHour, AvgQuestionsPerSession,
    SubjectServed, ChapterServed, ExamServed, DifficultyServed,
    SubjectAccuracy, ChapterAccuracy,
)
from typing import List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _wrap(data):
    return {"success": True, "data": data, "timestamp": datetime.utcnow().isoformat()}


@router.get(
    "/overview",
    summary="Dashboard overview",
    description=(
        "Returns all key KPIs in a single aggregated response — designed for the dashboard "
        "header cards. Replaces 6+ individual calls with one round-trip to the database."
    ),
)
async def get_overview():
    try:
        return _wrap(await AnalyticsService.get_overview())
    except Exception as e:
        logger.error("overview error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/daily-active-users",
    summary="Daily active users (DAU)",
    description="Unique users who started at least one session per day, grouped in IST timezone.",
)
async def get_daily_active_users(days: int = Query(30, ge=1, le=365, description="Lookback window in days")):
    try:
        return _wrap(await AnalyticsService.get_daily_active_users(days))
    except Exception as e:
        logger.error("DAU error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/weekly-active-users",
    summary="Weekly active users (WAU)",
    description="Unique users who started at least one session per calendar week (IST).",
)
async def get_weekly_active_users(weeks: int = Query(4, ge=1, le=52, description="Lookback window in weeks")):
    try:
        return _wrap(await AnalyticsService.get_weekly_active_users(weeks))
    except Exception as e:
        logger.error("WAU error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/questions-served",
    summary="Questions served",
    description="Total questions displayed to users, today's count, and average per session.",
)
async def get_questions_served():
    try:
        return _wrap(await AnalyticsService.get_questions_served())
    except Exception as e:
        logger.error("questions-served error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/questions-answered",
    summary="Questions answered",
    description="Correct vs incorrect response breakdown with overall accuracy percentage.",
)
async def get_questions_answered():
    try:
        return _wrap(await AnalyticsService.get_questions_answered())
    except Exception as e:
        logger.error("questions-answered error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/avg-response-time",
    summary="Average response time",
    description="Mean, median, and p95 per-question response time in milliseconds.",
)
async def get_avg_response_time():
    try:
        return _wrap(await AnalyticsService.get_avg_response_time())
    except Exception as e:
        logger.error("avg-response-time error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/completion-rate",
    summary="Session completion rate",
    description="Percentage of quiz sessions that were fully completed vs abandoned/interrupted.",
)
async def get_completion_rate():
    try:
        return _wrap(await AnalyticsService.get_completion_rate())
    except Exception as e:
        logger.error("completion-rate error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/drop-off",
    summary="Drop-off funnel analysis",
    description=(
        "Shows how many users reached and answered each question number (1–10). "
        "Identifies the exact question where learners most commonly abandon the quiz."
    ),
)
async def get_drop_off():
    try:
        return _wrap(await AnalyticsService.get_drop_off_analysis())
    except Exception as e:
        logger.error("drop-off error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/peak-hours",
    summary="Peak activity hours",
    description="Quiz session starts grouped by hour of day (IST, 0–23). All 24 hours returned.",
)
async def get_peak_hours():
    try:
        return _wrap(await AnalyticsService.get_peak_hours())
    except Exception as e:
        logger.error("peak-hours error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/avg-questions-per-session",
    summary="Average questions per session",
    description="Mean, min, and max number of questions answered across all quiz sessions.",
)
async def get_avg_questions_per_session():
    try:
        return _wrap(await AnalyticsService.get_avg_questions_per_session())
    except Exception as e:
        logger.error("avg-questions error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/subject-served",
    summary="Questions served by subject",
    description="Total questions served to users, grouped and ranked by subject.",
)
async def get_subject_served():
    try:
        return _wrap(await AnalyticsService.get_subject_served_counts())
    except Exception as e:
        logger.error("subject-served error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/chapter-served",
    summary="Questions served by chapter",
    description="Total questions served to users, grouped and ranked by chapter.",
)
async def get_chapter_served():
    try:
        return _wrap(await AnalyticsService.get_chapter_served_counts())
    except Exception as e:
        logger.error("chapter-served error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/exam-served",
    summary="Questions served by exam",
    description="Total questions served grouped by exam (JEE Main, NEET, NPTEL, etc.).",
)
async def get_exam_served():
    try:
        return _wrap(await AnalyticsService.get_exam_served_counts())
    except Exception as e:
        logger.error("exam-served error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/difficulty-served",
    summary="Questions served by difficulty",
    description="Total questions served grouped by difficulty level: easy / medium / hard.",
)
async def get_difficulty_served():
    try:
        return _wrap(await AnalyticsService.get_difficulty_served_counts())
    except Exception as e:
        logger.error("difficulty-served error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/subject-accuracy",
    summary="Accuracy by subject",
    description="Correct vs incorrect answer breakdown per subject, sorted by accuracy descending.",
)
async def get_subject_accuracy():
    try:
        return _wrap(await AnalyticsService.get_subject_accuracy())
    except Exception as e:
        logger.error("subject-accuracy error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/chapter-accuracy",
    summary="Accuracy by chapter",
    description=(
        "Correct vs incorrect breakdown per chapter. "
        "Useful for identifying weak chapters that need more learner attention."
    ),
)
async def get_chapter_accuracy():
    try:
        return _wrap(await AnalyticsService.get_chapter_accuracy())
    except Exception as e:
        logger.error("chapter-accuracy error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
