from fastapi import APIRouter, HTTPException
from app.services.exam_service import ExamService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("")
async def get_exams():
    """Get all exams"""
    try:
        exams = await ExamService.get_all_exams()
        return {
            "success": True,
            "data": [
                {
                    "exam_id": e["exam_id"],
                    "name": e["name"],
                    "description": e.get("description", ""),
                    "total_subjects": e.get("total_subjects", 0),
                    "total_questions": e.get("total_questions", 0)
                }
                for e in exams
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{exam_id}/subjects")
async def get_subjects(exam_id: str):
    """Get subjects for exam"""
    try:
        subjects = await ExamService.get_subjects_by_exam(exam_id)
        return {
            "success": True,
            "data": [
                {
                    "subject_id": s["subject_id"],
                    "exam_id": s["exam_id"],
                    "name": s["name"],
                    "total_chapters": s.get("total_chapters", 0),
                    "total_questions": s.get("total_questions", 0)
                }
                for s in subjects
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
