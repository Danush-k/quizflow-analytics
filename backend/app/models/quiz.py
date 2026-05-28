from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SessionStatus(str, Enum):
    IN_PROGRESS  = "in_progress"
    COMPLETED    = "completed"
    ABANDONED    = "abandoned"
    INTERRUPTED  = "interrupted"


class Difficulty(str, Enum):
    EASY   = "easy"
    MEDIUM = "medium"
    HARD   = "hard"


class QuizSessionCreate(BaseModel):
    user_id:    str = Field(..., description="Unique user identifier")
    chapter_id: str = Field(..., description="Chapter to quiz on")


class AnswerSubmit(BaseModel):
    session_id:           str           = Field(..., description="Active quiz session ID")
    question_id:          str           = Field(..., description="ID of the question being answered")
    user_answer:          str           = Field(..., description="Option letter selected (A/B/C/D) or full option text")
    response_duration_ms: Optional[int] = Field(5000, description="Time taken by user to answer, in milliseconds")


class AnswerResponse(BaseModel):
    is_correct:        bool = Field(..., description="Whether the submitted answer was correct")
    correct_answer:    str  = Field(..., description="The correct answer text")
    has_next_question: bool = Field(..., description="True if there are more questions in this session")
    current_score:     int  = Field(..., description="Running score percentage so far (0–100)")
    current_question:  int  = Field(..., description="Index of the next question (0-based)")
    total_questions:   int  = Field(..., description="Total questions in this quiz")
    response_time_ms:  int  = Field(..., description="Response duration echoed back in ms")


class QuestionResponse(BaseModel):
    question_id:     str = Field(..., description="Unique question identifier")
    question_text:   str = Field(..., description="The question content")
    options:        List[str] = Field(..., description="Four answer options [A, B, C, D]")
    question_number: int = Field(..., description="Current question number (1-based)")
    total_questions: int = Field(..., description="Total questions in this session")
    session_status:  str = Field(..., description="Current session status")


class ResultResponse(BaseModel):
    session_id:       str        = Field(..., description="Quiz session identifier")
    user_id:          str        = Field(..., description="User who took the quiz")
    chapter_name:     str        = Field(..., description="Name of the chapter quizzed")
    total_questions:  int        = Field(..., description="Total questions in the session")
    correct_answers:  int        = Field(..., description="Number of correct answers")
    score:            int        = Field(..., description="Final score as percentage (0–100)")
    time_taken_ms:    int        = Field(..., description="Total time taken for the session in ms")
    responses:       List[dict]  = Field(..., description="Per-question breakdown of answers")
