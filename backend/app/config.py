from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "quiz_app"
    
    # Server
    API_PREFIX: str = "/api"
    DEBUG: bool = False
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://quiz.example.com"
    ]
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Analytics
    ANALYTICS_LOOKBACK_DAYS: int = 30
    
    # Quiz
    DEFAULT_QUESTIONS_PER_QUIZ: int = 10
    
    class Config:
        env_file = ".env"

settings = Settings()
