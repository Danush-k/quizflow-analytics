"""Test suite for User Service"""
import pytest
from app.services.user_service import UserService


def test_user_service_exists():
    """Test UserService class exists"""
    assert UserService is not None


def test_user_service_is_class():
    """Test UserService is a proper class"""
    assert isinstance(UserService, type)


def test_user_service_has_methods():
    """Test UserService has expected static methods"""
    assert hasattr(UserService, 'create_user')
    assert hasattr(UserService, 'get_or_create_user')
    assert hasattr(UserService, 'update_last_active')
