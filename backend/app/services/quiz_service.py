from app.database.db import get_db
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class QuizService:
    @staticmethod
    async def start_quiz(user_id: str, chapter_id: str) -> dict:
        """Start a new quiz session"""
        db = await get_db()
        
        # Get questions for chapter
        questions = await db["questions"].find(
            {"chapter_id": chapter_id}
        ).to_list(length=None)
        
        if not questions:
            raise ValueError("No questions found for this chapter")
        
        session_id = f"sess_{uuid.uuid4().hex[:12]}"
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "chapter_id": chapter_id,
            "created_at": datetime.utcnow(),
            "started_at": datetime.utcnow(),
            "status": "in_progress",
            "total_questions": len(questions),
            "correct_answers": 0,
            "score": 0,
            "current_question_index": 0,
            "answers": []
        }
        
        await db["quiz_sessions"].insert_one(session_data)
        logger.info(f"✓ Quiz session started: {session_id}")
        
        return {
            "session_id": session_id,
            "total_questions": len(questions),
            "current_question_index": 0
        }
    
    @staticmethod
    async def get_current_question(session_id: str) -> dict:
        """Get current question for session"""
        db = await get_db()
        
        # Get session
        session = await db["quiz_sessions"].find_one({"session_id": session_id})
        if not session:
            raise ValueError("Session not found")
        
        # Get all questions for chapter
        questions = await db["questions"].find(
            {"chapter_id": session["chapter_id"]}
        ).to_list(length=None)
        
        # Get current question
        current_index = session["current_question_index"]
        if current_index >= len(questions):
            raise ValueError("Quiz already completed")
        
        current_question = questions[current_index]
        
        return {
            "question_id": current_question["question_id"],
            "question_text": current_question["question_text"],
            "options": current_question["options"],
            "question_number": current_index + 1,
            "total_questions": len(questions),
            "session_status": session["status"]
        }
    
    @staticmethod
    async def submit_answer(session_id: str, question_id: str, user_answer: str) -> dict:
        """Submit answer and move to next question"""
        db = await get_db()
        
        # Get session
        session = await db["quiz_sessions"].find_one({"session_id": session_id})
        if not session:
            raise ValueError("Session not found")
        
        # Get question
        question = await db["questions"].find_one({"question_id": question_id})
        if not question:
            raise ValueError("Question not found")
        
        # Check if answer is correct
        is_correct = user_answer == question["correct_answer"]
        
        # Record response with timestamps
        current_time = datetime.utcnow()
        response_data = {
            "response_id": f"resp_{uuid.uuid4().hex[:12]}",
            "session_id": session_id,
            "question_id": question_id,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "question_shown_at": current_time,  # Should be from GET, but recording here
            "answer_submitted_at": current_time,
            "response_duration_ms": 5000  # Default, would be calculated on frontend
        }
        
        await db["responses"].insert_one(response_data)
        
        # Update session
        new_correct = session["correct_answers"] + (1 if is_correct else 0)
        new_index = session["current_question_index"] + 1
        
        # Get total questions
        questions = await db["questions"].find(
            {"chapter_id": session["chapter_id"]}
        ).to_list(length=None)
        total_questions = len(questions)
        
        # Check if quiz is completed
        has_next = new_index < total_questions
        
        # Update session
        update_data = {
            "correct_answers": new_correct,
            "current_question_index": new_index,
            "answers": session["answers"] + [user_answer]
        }
        
        if not has_next:
            update_data["status"] = "completed"
            update_data["completed_at"] = current_time
            update_data["score"] = int((new_correct / total_questions) * 100)
        
        await db["quiz_sessions"].update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # Calculate current score
        current_score = int((new_correct / (new_index if new_index > 0 else 1)) * 100)
        
        return {
            "is_correct": is_correct,
            "correct_answer": question["correct_answer"],
            "has_next_question": has_next,
            "current_score": current_score,
            "response_time_ms": 5000,
            "current_question": new_index,
            "total_questions": total_questions
        }
    
    @staticmethod
    async def complete_quiz(session_id: str) -> dict:
        """Complete quiz session"""
        db = await get_db()
        
        session = await db["quiz_sessions"].find_one({"session_id": session_id})
        if not session:
            raise ValueError("Session not found")
        
        # Update session
        await db["quiz_sessions"].update_one(
            {"session_id": session_id},
            {"$set": {
                "status": "completed",
                "completed_at": datetime.utcnow()
            }}
        )
        
        return {
            "session_id": session_id,
            "total_questions": session["total_questions"],
            "correct_answers": session["correct_answers"],
            "score": session.get("score", 0)
        }
    
    @staticmethod
    async def get_results(session_id: str) -> dict:
        """Get quiz session results"""
        db = await get_db()
        
        session = await db["quiz_sessions"].find_one({"session_id": session_id})
        if not session:
            raise ValueError("Session not found")
        
        # Get chapter name
        chapter = await db["chapters"].find_one({"chapter_id": session["chapter_id"]})
        chapter_name = chapter["name"] if chapter else "Unknown"
        
        # Get responses
        responses = await db["responses"].find(
            {"session_id": session_id}
        ).to_list(length=None)
        
        # Format responses
        formatted_responses = []
        for idx, resp in enumerate(responses):
            question = await db["questions"].find_one({"question_id": resp["question_id"]})
            formatted_responses.append({
                "question_number": idx + 1,
                "question_text": question["question_text"] if question else "",
                "user_answer": resp["user_answer"],
                "correct_answer": resp["correct_answer"],
                "is_correct": resp["is_correct"],
                "response_time_ms": resp.get("response_duration_ms", 0)
            })
        
        return {
            "session_id": session_id,
            "user_id": session["user_id"],
            "chapter_name": chapter_name,
            "total_questions": session["total_questions"],
            "correct_answers": session["correct_answers"],
            "score": session.get("score", 0),
            "time_taken_ms": int((session.get("completed_at", datetime.utcnow()) - session["started_at"]).total_seconds() * 1000),
            "responses": formatted_responses
        }
