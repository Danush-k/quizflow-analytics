from fastapi import APIRouter, HTTPException
from app.services.exam_service import ExamService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{subject_id}/chapters")
async def get_chapters(subject_id: str):
    """Get chapters for subject"""
    try:
        chapters = await ExamService.get_chapters_by_subject(subject_id)
        if not chapters:
            return {
                "success": True,
                "data": [],
                "message": "No chapters found for this subject",
                "timestamp": datetime.utcnow().isoformat()
            }
        return {
            "success": True,
            "data": [
                {
                    "chapter_id": c["chapter_id"],
                    "subject_id": c["subject_id"],
                    "name": c["name"],
                    "total_questions": c.get("total_questions", 0)
                }
                for c in chapters
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching chapters: {e}")
        raise HTTPException(status_code=500, detail=str(e))
