from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys

from app.config import settings
from app.database.db import connect_db, close_db
from app.routes import users, exams, quiz, analytics, admin, subjects
from app.routes.subjects import chapters_router

# Structured logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: connect on startup, disconnect on shutdown."""
    logger.info("🚀 Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)
    await connect_db()
    logger.info("✓ Database ready")
    yield
    logger.info("🛑 Shutting down %s...", settings.APP_NAME)
    await close_db()
    logger.info("✓ Database connection closed")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "**SkillBytes** is a full-stack adaptive quiz platform for competitive exam preparation "
        "(JEE, NEET, NPTEL). It provides structured quiz sessions, real-time answer grading, "
        "and a rich analytics layer for tracking learner engagement and performance.\n\n"
        "## Key Capabilities\n"
        "- 📚 Hierarchical content: Exam → Subject → Chapter → Questions\n"
        "- 🧠 Session-based quiz engine with state tracking\n"
        "- 📊 14+ analytics metrics with MongoDB aggregation pipelines\n"
        "- ⏱️ Per-question response time tracking\n"
        "- 🔍 Drop-off, accuracy, and peak-hour analysis\n"
    ),
    contact={
        "name": "SkillBytes Team",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache prevention middleware for analytics endpoints
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/analytics"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Routers
app.include_router(users.router,     prefix=f"{settings.API_PREFIX}/users",     tags=["Users"])
app.include_router(exams.router,     prefix=f"{settings.API_PREFIX}/exams",     tags=["Exams & Subjects"])
app.include_router(subjects.router,  prefix=f"{settings.API_PREFIX}/subjects",  tags=["Exams & Subjects"])
app.include_router(chapters_router,  prefix=f"{settings.API_PREFIX}/chapters",  tags=["Exams & Subjects"])
app.include_router(quiz.router,      prefix=f"{settings.API_PREFIX}/quiz",      tags=["Quiz Engine"])
app.include_router(analytics.router, prefix=f"{settings.API_PREFIX}/analytics", tags=["Analytics"])
app.include_router(admin.router,     prefix=f"{settings.API_PREFIX}/admin",     tags=["Admin"])


@app.get("/health", tags=["Health"], summary="Health check")
async def health_check():
    """Returns service status. Used by load balancers and uptime monitors."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
