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

async def ensure_indexes():
    """Ensure high-performance indexes are created on pandals collection."""
    try:
        col = db.db[settings.PANDAL_COLLECTION_NAME]
        # Text index for pandal search and autocomplete
        await col.create_index([("name", "text"), ("cluster", "text"), ("zone", "text")], background=True)
        # B-Tree indexes for fast exact/prefix lookups and sorting
        await col.create_index("name", background=True)
        await col.create_index([("region", 1), ("cluster", 1)], background=True)
        await col.create_index("nearest_stations.name", background=True)
        await col.create_index("nearest_metro.name", background=True)
        await col.create_index([("location.latitude", 1), ("location.longitude", 1)], background=True)
        logger.info("MongoDB collection indexes ensured successfully.")
    except Exception as e:
        logger.warning("Index creation notice: %s", e)


async def connect_to_mongo():
    """Initializes MongoDB connection with connection pooling on FastAPI app startup."""
    logger.info("Connecting to MongoDB at: %s", settings.MONGODB_URL)
    db.client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=50,
        minPoolSize=5,
        maxIdleTimeMS=45000,
        serverSelectionTimeoutMS=5000,
    )
    db.db = db.client[settings.MONGODB_DB_NAME]
    logger.info("Successfully connected to database: %s", settings.MONGODB_DB_NAME)

    # Ensure collection indexes
    await ensure_indexes()

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
                        await ensure_indexes()
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
