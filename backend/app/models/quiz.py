from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class QuizSessionCreate(BaseModel):
    user_id: str
    chapter_id: str

class AnswerSubmit(BaseModel):
    session_id: str
    question_id: str
    user_answer: str

class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    has_next_question: bool
    current_score: int
    current_question: int
    total_questions: int
    response_time_ms: int

class QuestionResponse(BaseModel):
    question_id: str
    question_text: str
    options: List[str]
    question_number: int
    total_questions: int
    session_status: str

class ResultResponse(BaseModel):
    session_id: str
    user_id: str
    chapter_name: str
    total_questions: int
    correct_answers: int
    score: int
    time_taken_ms: int
    responses: List[dict]
