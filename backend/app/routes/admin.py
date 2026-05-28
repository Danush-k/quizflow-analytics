"""
Admin routes — data seeding and system statistics.
These endpoints are intended for development and evaluation only.
"""
from fastapi import APIRouter, HTTPException, Header
from app.services.data_seeder import DataSeeder
from app.database.db import get_db
from app.config import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Simple admin key check — prevents accidental re-seeding in production
ADMIN_KEY = "skillbytes-admin-2024"


@router.post(
    "/seed-data",
    summary="Seed database with demo data",
    description=(
        "Populates MongoDB with realistic quiz data: users, sessions, responses, "
        "questions, chapters, subjects, and exams. "
        "Pass `X-Admin-Key: skillbytes-admin-2024` header to authorize. "
        "Set `clear_existing=true` to wipe existing data first."
    ),
)
async def seed_data(clear_existing: bool = True, x_admin_key: str = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Admin-Key header")
    try:
        result = await DataSeeder.seed_all_data(clear_existing)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error("seed_data error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/stats",
    summary="System statistics",
    description="Returns document counts for all collections — a quick sanity check of the database state.",
)
async def get_stats():
    try:
        db = await get_db()
        stats = {
            "total_users":     await db["users"].count_documents({}),
            "total_exams":     await db["exams"].count_documents({}),
            "total_subjects":  await db["subjects"].count_documents({}),
            "total_chapters":  await db["chapters"].count_documents({}),
            "total_questions": await db["questions"].count_documents({}),
            "total_sessions":  await db["quiz_sessions"].count_documents({}),
            "total_responses": await db["responses"].count_documents({}),
        }
        return {"success": True, "data": stats, "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error("get_stats error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
