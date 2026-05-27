from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: Optional[str]
    created_at: datetime
    last_active: datetime
