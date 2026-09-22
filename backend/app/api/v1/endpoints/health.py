"""
app/api/v1/endpoints/health.py
-------------------------------
Health check endpoint to verify server status and MongoDB connection.
"""

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.core.cache import cache

router = APIRouter()


@router.get("/health", summary="Health Check")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Check API server and MongoDB database health."""
    db_status = "healthy"
    try:
        # Ping MongoDB database
        await db.command("ping")
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    cache_status = "redis_connected" if cache.is_redis_active else "in_memory_fallback"

    return {
        "status": "online",
        "database": db_status,
        "cache": cache_status,
        "service": "Debi-Dorshon Backend API"
    }
