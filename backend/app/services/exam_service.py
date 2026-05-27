from app.database.db import get_db
import logging

logger = logging.getLogger(__name__)

class ExamService:
    @staticmethod
    async def get_all_exams() -> list:
        """Get all exams"""
        db = await get_db()
        exams = await db["exams"].find().to_list(length=None)
        return exams or []
    
    @staticmethod
    async def get_subjects_by_exam(exam_id: str) -> list:
        """Get all subjects for an exam"""
        db = await get_db()
        subjects = await db["subjects"].find({"exam_id": exam_id}).to_list(length=None)
        return subjects or []
    
    @staticmethod
    async def get_chapters_by_subject(subject_id: str) -> list:
        """Get all chapters for a subject"""
        db = await get_db()
        chapters = await db["chapters"].find({"subject_id": subject_id}).to_list(length=None)
        return chapters or []
    
    @staticmethod
    async def get_questions_by_chapter(chapter_id: str) -> list:
        """Get all questions for a chapter"""
        db = await get_db()
        questions = await db["questions"].find({"chapter_id": chapter_id}).to_list(length=None)
        return questions or []
    
    @staticmethod
    async def get_chapter_by_id(chapter_id: str) -> dict:
        """Get chapter details"""
        db = await get_db()
        chapter = await db["chapters"].find_one({"chapter_id": chapter_id})
        return chapter
