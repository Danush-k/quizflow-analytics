"""Test suite for Quiz Service"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from app.services.quiz_service import QuizService


@pytest.mark.asyncio
async def test_start_session():
    """Test starting a quiz session"""
    mock_db = AsyncMock()
    mock_sessions = AsyncMock()
    mock_questions = AsyncMock()
    
    with patch('app.services.quiz_service.db.sessions', mock_sessions):
        with patch('app.services.quiz_service.db.questions', mock_questions):
            mock_sessions.insert_one.return_value = MagicMock(inserted_id="session_123")
            mock_questions.count_documents.return_value = 10
            mock_questions.find_one.return_value = {"_id": "q_1", "text": "Test Q"}
            
            service = QuizService()
            session = await service.start_session(user_id="usr_1", chapter_id="ch_1")
            
            assert session is not None
            mock_sessions.insert_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_current_question():
    """Test getting current question in session"""
    mock_questions = AsyncMock()
    mock_sessions = AsyncMock()
    
    with patch('app.services.quiz_service.db.questions', mock_questions):
        with patch('app.services.quiz_service.db.sessions', mock_sessions):
            mock_sessions.find_one.return_value = {
                "session_id": "s_1",
                "current_index": 0,
                "questions": ["q_1", "q_2"]
            }
            mock_questions.find_one.return_value = {
                "question_id": "q_1",
                "text": "What is 2+2?",
                "options": ["A", "B", "C", "D"],
                "correct_option": "A"
            }
            
            service = QuizService()
            question = await service.get_current_question("s_1")
            
            assert question is not None
            assert "question_id" in question


@pytest.mark.asyncio
async def test_submit_answer():
    """Test submitting an answer"""
    mock_responses = AsyncMock()
    mock_sessions = AsyncMock()
    
    with patch('app.services.quiz_service.db.responses', mock_responses):
        with patch('app.services.quiz_service.db.sessions', mock_sessions):
            mock_responses.insert_one.return_value = MagicMock(inserted_id="r_1")
            mock_sessions.update_one.return_value = MagicMock(modified_count=1)
            
            service = QuizService()
            result = await service.submit_answer(
                session_id="s_1",
                question_id="q_1",
                selected_option="A"
            )
            
            assert result is not None
            mock_responses.insert_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_results():
    """Test getting quiz results"""
    mock_sessions = AsyncMock()
    
    with patch('app.services.quiz_service.db.sessions', mock_sessions):
        mock_sessions.find_one.return_value = {
            "session_id": "s_1",
            "total_questions": 10,
            "correct_answers": 8,
            "score": 80,
            "status": "completed"
        }
        
        service = QuizService()
        results = await service.get_results("s_1")
        
        assert results is not None
        assert results["score"] == 80
