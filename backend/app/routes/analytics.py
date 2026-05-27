from fastapi import APIRouter, HTTPException
from app.services.analytics_service import AnalyticsService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/daily-active-users")
async def get_daily_active_users(days: int = 30):
    """Get daily active users"""
    try:
        data = await AnalyticsService.get_daily_active_users(days)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weekly-active-users")
async def get_weekly_active_users(weeks: int = 4):
    """Get weekly active users"""
    try:
        data = await AnalyticsService.get_weekly_active_users(weeks)
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/questions-served")
async def get_questions_served():
    """Get total questions served"""
    try:
        data = await AnalyticsService.get_questions_served()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/questions-answered")
async def get_questions_answered():
    """Get total questions answered"""
    try:
        data = await AnalyticsService.get_questions_answered()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/avg-response-time")
async def get_avg_response_time():
    """Get average response time"""
    try:
        data = await AnalyticsService.get_avg_response_time()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/completion-rate")
async def get_completion_rate():
    """Get quiz completion rate"""
    try:
        data = await AnalyticsService.get_completion_rate()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/drop-off")
async def get_drop_off():
    """Get drop-off analysis"""
    try:
        data = await AnalyticsService.get_drop_off_analysis()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/peak-hours")
async def get_peak_hours():
    """Get peak activity hours"""
    try:
        data = await AnalyticsService.get_peak_hours()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/avg-questions-per-session")
async def get_avg_questions_per_session():
    """Get average questions per session"""
    try:
        data = await AnalyticsService.get_avg_questions_per_session()
        return {
            "success": True,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
