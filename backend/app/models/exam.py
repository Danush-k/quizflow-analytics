from pydantic import BaseModel, Field
from typing import Optional, List


class ExamResponse(BaseModel):
    exam_id:         str           = Field(..., description="Unique exam identifier e.g. 'exam_jee_main'")
    name:            str           = Field(..., description="Display name of the exam")
    description:     Optional[str] = Field(None, description="Short description of the exam")
    total_subjects:  int           = Field(..., description="Number of subjects in this exam")
    total_questions: int           = Field(..., description="Total questions available across all subjects")


class SubjectResponse(BaseModel):
    subject_id:      str = Field(..., description="Unique subject identifier")
    exam_id:         str = Field(..., description="Parent exam identifier")
    name:            str = Field(..., description="Display name of the subject")
    total_chapters:  int = Field(..., description="Number of chapters in this subject")
    total_questions: int = Field(..., description="Total questions available in this subject")


class ChapterResponse(BaseModel):
    chapter_id:      str = Field(..., description="Unique chapter identifier")
    subject_id:      str = Field(..., description="Parent subject identifier")
    name:            str = Field(..., description="Display name of the chapter")
    total_questions: int = Field(..., description="Total questions available in this chapter")


class QuestionCreatePayload(BaseModel):
    chapter_id:    str           = Field(..., description="Chapter this question belongs to")
    question_text: str           = Field(..., description="The question content")
    options:       List[str]     = Field(..., description="List of four answer options")
    correct_answer: str          = Field(..., description="The correct answer text (must match one of options)")
    difficulty:    str           = Field("medium", description="Difficulty level: easy / medium / hard")
    explanation:   Optional[str] = Field(None, description="Explanation shown after answer is submitted")
