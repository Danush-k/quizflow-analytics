"""Test suite for User Service"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.user_service import UserService
from app.models.user import User


@pytest.fixture
def mock_db():
    """Mock MongoDB collection"""
    mock = AsyncMock()
    return mock


@pytest.mark.asyncio
async def test_create_user(mock_db):
    """Test user creation"""
    with patch('app.services.user_service.db.users', mock_db):
        mock_db.find_one.return_value = None
        mock_db.insert_one.return_value = MagicMock(inserted_id="test_id")
        
        service = UserService()
        user = await service.create_user(name="John Doe", email="john@example.com")
        
        assert user is not None
        mock_db.insert_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_or_create_user(mock_db):
    """Test get or create user"""
    with patch('app.services.user_service.db.users', mock_db):
        mock_db.find_one.return_value = {"user_id": "usr_123"}
        
        service = UserService()
        user = await service.get_or_create_user()
        
        assert user is not None
        mock_db.find_one.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_by_id(mock_db):
    """Test get user by ID"""
    with patch('app.services.user_service.db.users', mock_db):
        test_user = {"user_id": "usr_123", "name": "John Doe"}
        mock_db.find_one.return_value = test_user
        
        service = UserService()
        user = await service.get_user("usr_123")
        
        assert user is not None
        mock_db.find_one.assert_called_with({"user_id": "usr_123"})


@pytest.mark.asyncio
async def test_update_last_active(mock_db):
    """Test update last active timestamp"""
    with patch('app.services.user_service.db.users', mock_db):
        mock_db.update_one.return_value = MagicMock(modified_count=1)
        
        service = UserService()
        result = await service.update_last_active("usr_123")
        
        assert result is not None
        mock_db.update_one.assert_called_once()
