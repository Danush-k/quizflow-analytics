"""
Exam, Subject, and Chapter listing routes.
These are read-only endpoints that power the navigation drill-down:
  Exam List → Subject List → Chapter List → Start Quiz
"""
from fastapi import APIRouter, HTTPException
from app.services.exam_service import ExamService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "",
    summary="List all exams",
    description="Returns all available exams with subject and question counts.",
)
async def get_exams():
    try:
        exams = await ExamService.get_all_exams()
        return {
            "success": True,
            "data": [
                {
                    "exam_id":         e["exam_id"],
                    "name":            e["name"],
                    "description":     e.get("description", ""),
                    "total_subjects":  e.get("total_subjects", 0),
                    "total_questions": e.get("total_questions", 0),
                }
                for e in exams
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error("get_exams error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{exam_id}/subjects",
    summary="List subjects for an exam",
    description="Returns all subjects belonging to the given exam, with chapter and question counts.",
)
async def get_subjects(exam_id: str):
    try:
        subjects = await ExamService.get_subjects_by_exam(exam_id)
        return {
            "success": True,
            "data": [
                {
                    "subject_id":      s["subject_id"],
                    "exam_id":         s["exam_id"],
                    "name":            s["name"],
                    "total_chapters":  s.get("total_chapters", 0),
                    "total_questions": s.get("total_questions", 0),
                }
                for s in subjects
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error("get_subjects error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
