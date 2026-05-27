"""Test suite for Analytics Service"""
import pytest
from app.services.analytics_service import AnalyticsService


def test_analytics_service_exists():
    """Test AnalyticsService class exists"""
    assert AnalyticsService is not None


def test_analytics_service_has_methods():
    """Test AnalyticsService has expected methods"""
    assert hasattr(AnalyticsService, 'get_daily_active_users')
    assert hasattr(AnalyticsService, 'get_weekly_active_users')
    assert hasattr(AnalyticsService, 'get_questions_served')
    assert hasattr(AnalyticsService, 'get_questions_answered')
    assert hasattr(AnalyticsService, 'get_avg_response_time')
    assert hasattr(AnalyticsService, 'get_completion_rate')
    assert hasattr(AnalyticsService, 'get_drop_off_analysis')
    assert hasattr(AnalyticsService, 'get_peak_hours')
    assert hasattr(AnalyticsService, 'get_avg_questions_per_session')


def test_analytics_service_methods_callable():
    """Test AnalyticsService methods are callable"""
    assert callable(AnalyticsService.get_daily_active_users)
    assert callable(AnalyticsService.get_weekly_active_users)
    assert callable(AnalyticsService.get_questions_served)
    assert callable(AnalyticsService.get_questions_answered)
    assert callable(AnalyticsService.get_avg_response_time)
    assert callable(AnalyticsService.get_completion_rate)
    assert callable(AnalyticsService.get_drop_off_analysis)
    assert callable(AnalyticsService.get_peak_hours)
    assert callable(AnalyticsService.get_avg_questions_per_session)
