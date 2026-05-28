from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Establish MongoDB connection with pooling configured for Atlas."""
    global client, db
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=10000,
            socketTimeoutMS=30000,
            maxPoolSize=settings.DB_MAX_POOL_SIZE,
            minPoolSize=settings.DB_MIN_POOL_SIZE,
            retryWrites=True,
        )
        db = client[settings.DATABASE_NAME]

        # Verify connectivity
        await db.command("ping")
        logger.info("✓ Connected to MongoDB [pool: %d–%d]",
                    settings.DB_MIN_POOL_SIZE, settings.DB_MAX_POOL_SIZE)

        await _create_indexes()
    except Exception as e:
        logger.error("✗ Failed to connect to MongoDB: %s", e)
        raise


async def close_db():
    """Gracefully close the MongoDB connection pool."""
    if client:
        client.close()
        logger.info("✓ MongoDB connection pool closed")


async def get_db():
    """Dependency: returns the active database instance."""
    return db


async def _create_indexes():
    """
    Create compound and single-field indexes to support all query patterns.

    Index strategy:
    - Unique indexes on all *_id fields (fast lookups, prevents duplicates)
    - Secondary indexes on foreign keys used in $lookup and $match stages
    - Compound index on quiz_sessions(user_id, created_at) for time-series DAU queries
    - Compound index on responses(session_id, is_correct) for accuracy aggregations
    """
    try:
        # Users
        await db["users"].create_index("user_id", unique=True)

        # Exams
        await db["exams"].create_index("exam_id", unique=True)

        # Subjects
        await db["subjects"].create_index("subject_id", unique=True)
        await db["subjects"].create_index("exam_id")

        # Chapters
        await db["chapters"].create_index("chapter_id", unique=True)
        await db["chapters"].create_index("subject_id")

        # Questions
        await db["questions"].create_index("question_id", unique=True)
        await db["questions"].create_index("chapter_id")
        await db["questions"].create_index("difficulty")

        # Quiz Sessions — compound indexes for analytics queries
        await db["quiz_sessions"].create_index("session_id", unique=True)
        await db["quiz_sessions"].create_index([("user_id", 1), ("created_at", -1)])
        await db["quiz_sessions"].create_index([("created_at", -1)])
        await db["quiz_sessions"].create_index("status")

        # Responses — compound indexes for accuracy aggregations
        await db["responses"].create_index("response_id", unique=True)
        await db["responses"].create_index([("session_id", 1), ("is_correct", 1)])
        await db["responses"].create_index("question_id")
        await db["responses"].create_index([("answer_submitted_at", -1)])

        logger.info("✓ Indexes ensured")
    except Exception as e:
        logger.warning("Index creation warning (may already exist): %s", e)
