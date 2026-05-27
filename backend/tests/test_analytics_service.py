"""Test suite for Analytics Service"""
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta
from app.services.analytics_service import AnalyticsService


@pytest.mark.asyncio
async def test_daily_active_users():
    """Test DAU metric calculation"""
    mock_responses = AsyncMock()
    
    with patch('app.services.analytics_service.db.responses', mock_responses):
        mock_responses.aggregate.return_value = AsyncMock()
        mock_responses.aggregate.return_value.__aiter__.return_value = [
            {"_id": None, "count": 45}
        ]
        
        service = AnalyticsService()
        result = await service.get_daily_active_users()
        
        assert result is not None


@pytest.mark.asyncio
async def test_weekly_active_users():
    """Test WAU metric calculation"""
    mock_responses = AsyncMock()
    
    with patch('app.services.analytics_service.db.responses', mock_responses):
        mock_responses.aggregate.return_value = AsyncMock()
        mock_responses.aggregate.return_value.__aiter__.return_value = [
            {"_id": None, "count": 200}
        ]
        
        service = AnalyticsService()
        result = await service.get_weekly_active_users()
        
        assert result is not None


@pytest.mark.asyncio
async def test_questions_served():
    """Test questions served metric"""
    mock_responses = AsyncMock()
    
    with patch('app.services.analytics_service.db.responses', mock_responses):
        mock_responses.count_documents.return_value = 42660
        
        service = AnalyticsService()
        result = await service.get_questions_served()
        
        assert result == 42660


@pytest.mark.asyncio
async def test_completion_rate():
    """Test completion rate metric"""
    mock_sessions = AsyncMock()
    
    with patch('app.services.analytics_service.db.sessions', mock_sessions):
        mock_sessions.count_documents.side_effect = [3500, 5000]  # completed, total
        
        service = AnalyticsService()
        result = await service.get_completion_rate()
        
        assert result is not None
        assert isinstance(result, float)


@pytest.mark.asyncio
async def test_avg_response_time():
    """Test average response time metric"""
    mock_responses = AsyncMock()
    
    with patch('app.services.analytics_service.db.responses', mock_responses):
        mock_responses.aggregate.return_value = AsyncMock()
        mock_responses.aggregate.return_value.__aiter__.return_value = [
            {"_id": None, "avg_duration": 25.5}
        ]
        
        service = AnalyticsService()
        result = await service.get_avg_response_time()
        
        assert result is not None
