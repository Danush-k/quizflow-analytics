from fastapi import APIRouter, HTTPException
from app.services.user_service import UserService
from app.models.user import UserCreate, UserResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("")
async def get_or_create_user(user_id: str = None):
    """Get or create user"""
    try:
        user = await UserService.get_or_create_user(user_id)
        return {
            "success": True,
            "data": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user.get("email", ""),
                "created_at": user["created_at"].isoformat(),
                "last_active": user["last_active"].isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_user(data: UserCreate):
    """Create new user"""
    try:
        user = await UserService.create_user(data.name, data.email or "")
        return {
            "success": True,
            "data": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user.get("email", ""),
                "created_at": user["created_at"].isoformat()
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
