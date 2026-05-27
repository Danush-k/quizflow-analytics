from fastapi import APIRouter, HTTPException
from app.services.quiz_service import QuizService
from app.models.quiz import QuizSessionCreate, AnswerSubmit
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start")
async def start_quiz(data: QuizSessionCreate):
    """Start a new quiz session"""
    try:
        result = await QuizService.start_quiz(data.user_id, data.chapter_id)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
async def get_current_question(session_id: str):
    """Get current question for quiz session"""
    try:
        result = await QuizService.get_current_question(session_id)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/answer")
async def submit_answer(data: AnswerSubmit):
    """Submit answer to current question"""
    try:
        result = await QuizService.submit_answer(
            data.session_id,
            data.question_id,
            data.user_answer
        )
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/complete")
async def complete_quiz(session_id: str):
    """Complete quiz session"""
    try:
        result = await QuizService.complete_quiz(session_id)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/results")
async def get_results(session_id: str):
    """Get quiz session results"""
    try:
        result = await QuizService.get_results(session_id)
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
