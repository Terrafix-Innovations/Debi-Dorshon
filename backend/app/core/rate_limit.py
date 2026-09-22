"""
app/core/rate_limit.py
----------------------
API rate limiting using SlowAPI and Limits.
Protects compute-heavy endpoints (e.g. route planning, autocomplete) from burst abuse.
Supports Redis storage in production with seamless in-memory fallback.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
import logging

logger = logging.getLogger("uvicorn")


def check_redis_available(url: str) -> bool:
    """Check if Redis endpoint is reachable within 300ms."""
    if not url:
        return False
    try:
        import redis
        client = redis.from_url(url, socket_connect_timeout=0.3, socket_timeout=0.3)
        client.ping()
        client.close()
        return True
    except Exception:
        return False


def create_limiter() -> Limiter:
    """Create Limiter with Redis storage if available, fallback to memory."""
    has_redis = check_redis_available(settings.REDIS_URL) if settings.REDIS_URL else False
    if has_redis:
        logger.info("Configuring rate limiter with Redis storage at %s", settings.REDIS_URL)
        return Limiter(
            key_func=get_remote_address,
            default_limits=[settings.RATE_LIMIT_DEFAULT],
            storage_uri=settings.REDIS_URL,
            in_memory_fallback_enabled=True,
            swallow_errors=True,
        )
    else:
        logger.info("Configuring rate limiter with in-memory storage.")
        return Limiter(
            key_func=get_remote_address,
            default_limits=[settings.RATE_LIMIT_DEFAULT],
            storage_uri="memory://",
            swallow_errors=True,
        )


limiter = create_limiter()
