"""Test suite for Quiz Service"""
import pytest
from app.services.quiz_service import QuizService


def test_quiz_service_exists():
    """Test QuizService class exists"""
    assert QuizService is not None


def test_quiz_service_is_class():
    """Test QuizService is a proper class"""
    assert isinstance(QuizService, type)


def test_quiz_service_has_methods():
    """Test QuizService has expected static methods"""
    assert hasattr(QuizService, 'start_quiz')
    assert hasattr(QuizService, 'get_current_question')
    assert hasattr(QuizService, 'submit_answer')
    assert hasattr(QuizService, 'get_results')
