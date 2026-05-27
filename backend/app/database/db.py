from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None

async def connect_db():
    """Connect to MongoDB"""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[settings.DATABASE_NAME]
        
        # Verify connection
        await db.command("ping")
        logger.info("✓ Connected to MongoDB")
        
        # Create indexes
        await create_indexes()
    except Exception as e:
        logger.error(f"✗ Failed to connect to MongoDB: {e}")
        raise

async def close_db():
    """Close MongoDB connection"""
    if client:
        client.close()
        logger.info("✓ Closed MongoDB connection")

async def get_db():
    """Get database instance"""
    return db

async def create_indexes():
    """Create indexes for performance"""
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
        
        # Quiz Sessions
        await db["quiz_sessions"].create_index("session_id", unique=True)
        await db["quiz_sessions"].create_index("user_id")
        await db["quiz_sessions"].create_index([("created_at", -1)])
        
        # Responses
        await db["responses"].create_index("response_id", unique=True)
        await db["responses"].create_index("session_id")
        await db["responses"].create_index("question_id")
        
        logger.info("✓ Indexes created")
    except Exception as e:
        logger.error(f"✗ Failed to create indexes: {e}")
