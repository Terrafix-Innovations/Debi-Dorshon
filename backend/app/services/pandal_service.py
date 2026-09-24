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


def _load_fallback_pandals() -> List[dict]:
    search_paths = [
        Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "debi_dorshon.json",
        Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "debi_dorshon.json",
        Path("/app/data/processed/debi_dorshon.json"),
    ]
    for p in search_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for idx, d in enumerate(data):
                        if "_id" not in d:
                            d["_id"] = f"66e000000000000000000{idx:03d}"
                        if "id" not in d:
                            d["id"] = str(d["_id"])
                    return data
            except Exception:
                pass
    return []


class PandalService:
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        self.collection = db[settings.PANDAL_COLLECTION_NAME] if db is not None else None
        self._fallback_data = None

    def _get_fallback_data() -> List[dict]:
        if self._fallback_data is None:
            self._fallback_data = _load_fallback_pandals()
        return self._fallback_data

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

                if pandals:
                    await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
                    return pandals
        except Exception:
            pass

        # Fallback to debi_dorshon.json if MongoDB query fails or is not connected
        all_data = _load_fallback_pandals()
        filtered = []
        for doc in all_data:
            if region and not re.search(region, doc.get("region", ""), re.IGNORECASE):
                continue
            if cluster and not re.search(cluster, doc.get("cluster", ""), re.IGNORECASE):
                continue
            if search and not re.search(search, doc.get("name", ""), re.IGNORECASE):
                continue
            filtered.append(doc)

        result = filtered[skip : skip + limit]
        await cache.set_json(cache_key, result, expire=settings.CACHE_TTL_STATION_PANDALS)
        return result

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
        except Exception:
            pass

        # Fallback search by ID string or index
        for doc in _load_fallback_pandals():
            if str(doc.get("id")) == str(pandal_id) or str(doc.get("_id")) == str(pandal_id):
                await cache.set_json(cache_key, doc, expire=settings.CACHE_TTL_TRANSIT)
                return doc

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
                if count > 0:
                    await cache.set_json(cache_key, count, expire=settings.CACHE_TTL_TRANSIT)
                    return count
        except Exception:
            pass

        count = len(_load_fallback_pandals())
        await cache.set_json(cache_key, count, expire=settings.CACHE_TTL_TRANSIT)
        return count


