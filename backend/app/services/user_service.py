from app.database.db import get_db
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    async def create_user(name: str, email: str = "") -> dict:
        """Create a new user"""
        db = await get_db()
        
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        user_data = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow(),
            "total_sessions": 0,
            "total_correct": 0
        }
        
        await db["users"].insert_one(user_data)
        logger.info(f"✓ User created: {user_id}")
        return user_data
    
    @staticmethod
    async def get_or_create_user(user_id: str = None) -> dict:
        """Get existing user or create new one"""
        db = await get_db()
        
        if user_id:
            user = await db["users"].find_one({"user_id": user_id})
            if user:
                await db["users"].update_one(
                    {"user_id": user_id},
                    {"$set": {"last_active": datetime.utcnow()}}
                )
                return user
        
        # Create new user
        return await UserService.create_user(f"User_{uuid.uuid4().hex[:6]}", "")
    
    @staticmethod
    async def update_last_active(user_id: str):
        """Update user's last active timestamp"""
        db = await get_db()
        await db["users"].update_one(
            {"user_id": user_id},
            {"$set": {"last_active": datetime.utcnow()}}
        )
