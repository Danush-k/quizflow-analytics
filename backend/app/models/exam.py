from pydantic import BaseModel
from typing import Optional

class ExamResponse(BaseModel):
    exam_id: str
    name: str
    description: Optional[str]
    total_subjects: int
    total_questions: int

class SubjectResponse(BaseModel):
    subject_id: str
    exam_id: str
    name: str
    total_chapters: int
    total_questions: int

class ChapterResponse(BaseModel):
    chapter_id: str
    subject_id: str
    name: str
    total_questions: int

class QuestionCreatePayload(BaseModel):
    chapter_id: str
    question_text: str
    options: list
    correct_answer: str
    difficulty: str = "medium"
