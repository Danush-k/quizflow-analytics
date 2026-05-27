from fastapi import APIRouter, HTTPException
from app.services.data_seeder import DataSeeder
from app.database.db import get_db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/seed-data")
async def seed_data(clear_existing: bool = True):
    """Seed dummy data"""
    try:
        result = await DataSeeder.seed_all_data(clear_existing)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats():
    """Get system statistics"""
    try:
        db = await get_db()
        
        stats = {
            "total_users": await db["users"].count_documents({}),
            "total_exams": await db["exams"].count_documents({}),
            "total_subjects": await db["subjects"].count_documents({}),
            "total_chapters": await db["chapters"].count_documents({}),
            "total_questions": await db["questions"].count_documents({}),
            "total_sessions": await db["quiz_sessions"].count_documents({}),
            "total_responses": await db["responses"].count_documents({})
        }
        
        return {
            "success": True,
            "data": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
