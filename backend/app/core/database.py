"""
app/core/database.py
--------------------
Async MongoDB connection lifecycle manager using Motor driver.
Provides global database instance access across endpoint dependencies.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger("uvicorn")


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db = Database()


import json
from pathlib import Path

async def connect_to_mongo():
    """Initializes MongoDB connection on FastAPI app startup."""
    logger.info("Connecting to MongoDB at: %s", settings.MONGODB_URL)
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.MONGODB_DB_NAME]
    logger.info("Successfully connected to database: %s", settings.MONGODB_DB_NAME)

    # Auto-seed if collection is empty
    try:
        col = db.db[settings.PANDAL_COLLECTION_NAME]
        count = await col.count_documents({})
        if count == 0:
            logger.info("Pandal collection is empty. Checking for seed dataset...")
            search_paths = [
                Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "debi_dorshon.json",
                Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "debi_dorshon.json",
                Path("/app/data/processed/debi_dorshon.json"),
                Path("/app/debi_dorshon.json"),
            ]
            for p in search_paths:
                if p.exists():
                    logger.info("Auto-seeding pandals from %s", p)
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if data:
                        await col.insert_many(data)
                        await col.create_index("nearest_stations.name")
                        await col.create_index("nearest_metro.name")
                        logger.info("Auto-seeded %d pandals into MongoDB!", len(data))
                    break
    except Exception as e:
        logger.warning("Auto-seed check encountered an issue: %s", e)


async def close_mongo_connection():
    """Closes MongoDB connection on FastAPI app shutdown."""
    if db.client:
        logger.info("Closing MongoDB connection...")
        db.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency injection helper to get MongoDB database instance."""
    return db.db
