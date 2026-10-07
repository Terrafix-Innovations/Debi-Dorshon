"""
app/services/pandal_service.py
-------------------------------
Service layer containing all MongoDB queries and business logic for Pandals.
Acts like Controllers / DAO in MVC frameworks (Node/Express).
"""

import json
import re
from pathlib import Path
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.cache import cache


class PandalService:
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        self.collection = db[settings.PANDAL_COLLECTION_NAME] if db is not None else None

    async def get_all_pandals(
        self,
        region: Optional[str] = None,
        cluster: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[dict]:
        """Fetch pandals with optional filtering, search, pagination, and caching."""
        cache_key = f"cache:pandals:list:{region or 'all'}:{cluster or 'all'}:{search or 'all'}:{skip}:{limit}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        try:
            if self.collection is not None:
                query = {}
                if region:
                    query["region"] = {"$regex": region, "$options": "i"}
                if cluster:
                    query["cluster"] = {"$regex": cluster, "$options": "i"}
                if search:
                    query["name"] = {"$regex": search, "$options": "i"}

                cursor = self.collection.find(query).skip(skip).limit(limit)
                pandals = []
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    doc["id"] = doc["_id"]
                    pandals.append(doc)

                await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
                return pandals
        except Exception as e:
            print(f"Error querying pandals: {e}")
            
        return []

    async def get_pandal_by_id(self, pandal_id: str) -> Optional[dict]:
        """Fetch a single pandal by its ID (cached)."""
        cache_key = f"cache:pandal:id:{pandal_id}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        try:
            if self.collection is not None and ObjectId.is_valid(pandal_id):
                doc = await self.collection.find_one({"_id": ObjectId(pandal_id)})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    doc["id"] = doc["_id"]
                    await cache.set_json(cache_key, doc, expire=settings.CACHE_TTL_TRANSIT)
                    return doc
        except Exception as e:
            print(f"Error querying pandal by ID: {e}")

        return None

    async def count_pandals(self) -> int:
        """Get total count of pandals in database (cached)."""
        cache_key = "cache:pandals:count"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        try:
            if self.collection is not None:
                count = await self.collection.count_documents({})
                await cache.set_json(cache_key, count, expire=settings.CACHE_TTL_TRANSIT)
                return count
        except Exception as e:
            print(f"Error counting pandals: {e}")

        return 0


