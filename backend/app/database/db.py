from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db

    mongo_uri = settings.get_mongo_uri()
    if not mongo_uri:
        raise RuntimeError(
            "MONGODB_URI env variable is not set. "
            "Add it in your deployment environment."
        )

    try:
        client = AsyncIOMotorClient(
            mongo_uri,
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=10000,
            socketTimeoutMS=30000,
            maxPoolSize=settings.DB_MAX_POOL_SIZE,
            minPoolSize=settings.DB_MIN_POOL_SIZE,
            retryWrites=True,
            tls=True,
            tlsAllowInvalidCertificates=True,
        )
        db = client[settings.DATABASE_NAME]

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
    try:
        await db["users"].create_index("user_id", unique=True)
        await db["exams"].create_index("exam_id", unique=True)
        await db["subjects"].create_index("subject_id", unique=True)
        await db["subjects"].create_index("exam_id")
        await db["chapters"].create_index("chapter_id", unique=True)
        await db["chapters"].create_index("subject_id")
        await db["questions"].create_index("question_id", unique=True)
        await db["questions"].create_index("chapter_id")
        await db["questions"].create_index("difficulty")
        await db["quiz_sessions"].create_index("session_id", unique=True)
        await db["quiz_sessions"].create_index([("user_id", 1), ("created_at", -1)])
        await db["quiz_sessions"].create_index([("created_at", -1)])
        await db["quiz_sessions"].create_index("status")
        await db["responses"].create_index("response_id", unique=True)
        await db["responses"].create_index([("session_id", 1), ("is_correct", 1)])
        await db["responses"].create_index("question_id")
        await db["responses"].create_index([("answer_submitted_at", -1)])
        logger.info("✓ Indexes ensured")
    except Exception as e:
        logger.warning("Index creation warning: %s", e)
