"""
app/core/cache.py
-----------------
High-performance asynchronous caching layer with Redis backend and in-memory fallback.
Guarantees zero-downtime: if Redis is unavailable or disconnected, automatically
falls back to in-memory TTL caching so requests never fail.
"""

import json
import logging
import time
from typing import Any, Dict, Optional, Tuple
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("uvicorn")


class _InMemoryCache:
    """Fallback in-memory cache with TTL support."""

    def __init__(self):
        self._store: Dict[str, Tuple[str, float]] = {}

    def get(self, key: str) -> Optional[str]:
        item = self._store.get(key)
        if not item:
            return None
        val, expiry = item
        if expiry and time.time() > expiry:
            del self._store[key]
            return None
        return val

    def set(self, key: str, value: str, expire: int = 3600):
        # Prune oversized store if memory exceeds 2000 keys
        if len(self._store) > 2000:
            now = time.time()
            expired = [k for k, (_, exp) in self._store.items() if exp and now > exp]
            for k in expired:
                del self._store[k]
            if len(self._store) > 2000:
                self._store.clear()

        expiry = time.time() + expire if expire > 0 else float("inf")
        self._store[key] = (value, expiry)

    def delete(self, key: str):
        self._store.pop(key, None)

    def clear(self):
        self._store.clear()


class CacheService:
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.in_memory = _InMemoryCache()
        self.is_redis_active: bool = False

    async def init_cache(self):
        """Initializes Redis connection or enables in-memory fallback."""
        if not settings.REDIS_URL:
            logger.info("REDIS_URL not configured. Running with in-memory TTL cache.")
            self.is_redis_active = False
            return

        try:
            self.redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=25,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            await self.redis_client.ping()
            self.is_redis_active = True
            logger.info("Successfully connected to Redis cache at %s", settings.REDIS_URL)
        except Exception as e:
            self.is_redis_active = False
            logger.warning(
                "Could not connect to Redis (%s). Operating in-memory cache fallback.", e
            )

    async def close_cache(self):
        """Closes Redis connection on application shutdown."""
        if self.redis_client:
            try:
                await self.redis_client.aclose()
            except Exception:
                pass
            self.redis_client = None
            self.is_redis_active = False
            logger.info("Redis cache connection closed.")

    async def get(self, key: str) -> Optional[str]:
        """Fetch raw string from cache."""
        if self.is_redis_active and self.redis_client:
            try:
                val = await self.redis_client.get(key)
                if val is not None:
                    return val
            except Exception as e:
                logger.warning("Redis GET error for key %s: %s. Falling back to in-memory.", key, e)
        return self.in_memory.get(key)

    async def set(self, key: str, value: str, expire: int = 3600):
        """Store raw string in cache with TTL (in seconds)."""
        stored_in_redis = False
        if self.is_redis_active and self.redis_client:
            try:
                await self.redis_client.set(key, value, ex=expire)
                stored_in_redis = True
            except Exception as e:
                logger.warning("Redis SET error for key %s: %s. Falling back to in-memory.", key, e)
        if not stored_in_redis:
            self.in_memory.set(key, value, expire=expire)

    async def get_json(self, key: str) -> Optional[Any]:
        """Fetch and deserialize JSON from cache."""
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None

    async def set_json(self, key: str, value: Any, expire: int = 3600):
        """Serialize and store JSON in cache with TTL (in seconds)."""
        try:
            raw = json.dumps(value, ensure_ascii=False)
            await self.set(key, raw, expire=expire)
        except Exception as e:
            logger.warning("JSON serialization error for cache key %s: %s", key, e)

    async def delete(self, key: str):
        """Remove a key from cache."""
        if self.is_redis_active and self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception:
                pass
        self.in_memory.delete(key)

    async def clear(self):
        """Clear all cache entries."""
        if self.is_redis_active and self.redis_client:
            try:
                await self.redis_client.flushdb()
            except Exception:
                pass
        self.in_memory.clear()


# Global cache service instance
cache = CacheService()
