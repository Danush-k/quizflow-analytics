"""
Quiz engine routes — manages the full quiz session lifecycle:
  start → get question → submit answer → complete → results
"""
from fastapi import APIRouter, HTTPException, Header
from app.services.quiz_service import QuizService
from app.models.quiz import QuizSessionCreate, AnswerSubmit, AnswerResponse, QuestionResponse, ResultResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class QuizStartRequest(AnswerSubmit.__class__):
    pass


from pydantic import BaseModel

class QuizStartRequest(BaseModel):
    chapter_id: str


@router.post(
    "/start",
    summary="Start a quiz session",
    description=(
        "Creates a new quiz session for a given chapter. "
        "Requires the `X-User-ID` header to identify the learner. "
        "Returns the session ID and total question count."
    ),
)
async def start_quiz(data: QuizStartRequest, x_user_id: str = Header(None)):
    try:
        if not x_user_id:
            raise HTTPException(status_code=401, detail="User ID required — send X-User-ID header")
        result = await QuizService.start_quiz(x_user_id, data.chapter_id)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("start_quiz error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/session/{session_id}",
    summary="Get current question",
    description="Returns the current unanswered question for the active session.",
)
async def get_current_question(session_id: str):
    try:
        result = await QuizService.get_current_question(session_id)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("get_question error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/answer",
    summary="Submit an answer",
    description=(
        "Grades the submitted answer, records the response with timing data, "
        "advances the session index, and returns whether the answer was correct "
        "along with a running score."
    ),
)
async def submit_answer(data: AnswerSubmit):
    try:
        result = await QuizService.submit_answer(
            data.session_id, data.question_id, data.user_answer, data.response_duration_ms
        )
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("submit_answer error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/session/{session_id}/complete",
    summary="Mark session as complete",
    description="Explicitly marks the session as completed and calculates the final score.",
)
async def complete_quiz(session_id: str):
    try:
        result = await QuizService.complete_quiz(session_id)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("complete_quiz error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/session/{session_id}/results",
    summary="Get session results",
    description="Returns final score, total questions, correct count, and time taken for a completed session.",
)
async def get_results(session_id: str):
    try:
        result = await QuizService.get_results(session_id)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("get_results error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/session/{session_id}/responses",
    summary="Get all responses for a session",
    description=(
        "Returns the full answer review for a session — every question with the user's answer, "
        "the correct answer, correctness, response time, and explanation. "
        "Questions not reached are included with null user_answer."
    ),
)
async def get_responses(session_id: str):
    try:
        result = await QuizService.get_responses(session_id)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("get_responses error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/session/{session_id}/interrupt",
    summary="Interrupt a quiz session",
    description="Marks the session as 'interrupted' when the user navigates away mid-quiz.",
)
async def interrupt_quiz(session_id: str):
    try:
        result = await QuizService.interrupt_quiz(session_id)
        return {"success": True, "data": result, "timestamp": datetime.utcnow().isoformat()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("interrupt_quiz error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
