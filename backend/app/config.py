from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SkillBytes Quiz API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"

    # Database — must be set via environment variable (MONGODB_URI or MONGO_URL)
    # No localhost fallback: deployment will fail fast if the env var is missing
    MONGODB_URI: str = ""
    MONGO_URL: str = ""         # Alias accepted by some deployment platforms
    DATABASE_NAME: str = "quiz_app"

    # Connection Pool
    DB_MAX_POOL_SIZE: int = 10
    DB_MIN_POOL_SIZE: int = 1

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

    model_config = {"env_file": ".env", "extra": "ignore"}

    def get_mongo_uri(self) -> str:
        """Returns whichever MongoDB URI env var is set (MONGODB_URI takes priority over MONGO_URL)."""
        return self.MONGODB_URI or self.MONGO_URL or ""


settings = Settings()
