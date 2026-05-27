from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database.db import connect_db, close_db
from app.routes import users, exams, quiz, analytics, admin

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting FastAPI application...")
    await connect_db()
    logger.info("✓ Connected to MongoDB")
    yield
    # Shutdown
    logger.info("🛑 Shutting down...")
    await close_db()
    logger.info("✓ Disconnected from MongoDB")

# Create FastAPI app
app = FastAPI(
    title="WhatsApp-Style Quiz API",
    version="1.0.0",
    description="Quiz application with analytics",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix=f"{settings.API_PREFIX}/users", tags=["users"])
app.include_router(exams.router, prefix=f"{settings.API_PREFIX}/exams", tags=["exams"])
app.include_router(quiz.router, prefix=f"{settings.API_PREFIX}/quiz", tags=["quiz"])
app.include_router(analytics.router, prefix=f"{settings.API_PREFIX}/analytics", tags=["analytics"])
app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["admin"])

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "quiz-api",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
