"""
app/services/transit_service.py
--------------------------------
Service layer for Ride by Metro and Ride by Train features.
Queries MongoDB for distinct transit hubs and associated pandals.
"""

import re
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.cache import cache


class TransitService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db[settings.PANDAL_COLLECTION_NAME]

    async def get_metro_stations(self) -> List[Dict]:
        """Aggregate all distinct metro stations with pandal counts (cached)."""
        cache_key = "cache:transit:metro:stations"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached
        pipeline = [
            {"$match": {"nearest_metro.name": {"$exists": True, "$ne": None}}},
            {
                "$group": {
                    "_id": {
                        "name": "$nearest_metro.name",
                        "line": "$nearest_metro.line"
                    },
                    "pandal_count": {"$sum": 1}
                }
            },
            {"$sort": {"pandal_count": -1, "_id.name": 1}}
        ]
        results = []
        async for doc in self.collection.aggregate(pipeline):
            results.append({
                "name": doc["_id"]["name"],
                "line": doc["_id"].get("line"),
                "pandal_count": doc["pandal_count"]
            })
        await cache.set_json(cache_key, results, expire=settings.CACHE_TTL_TRANSIT)
        return results

    async def get_pandals_by_metro(
        self, station_name: str, line: Optional[str] = None
    ) -> List[Dict]:
        """Get all pandals near a specific metro station (cached)."""
        clean_name = station_name.strip().lower()
        clean_line = line.strip().lower() if line else "all"
        cache_key = f"cache:transit:metro:{clean_name}:{clean_line}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        escaped_name = re.escape(station_name.strip())
        query = {
            "nearest_metro.name": {"$regex": f"^{escaped_name}$", "$options": "i"}
        }
        if line:
            escaped_line = re.escape(line.strip())
            query["nearest_metro.line"] = {"$regex": f"^{escaped_line}$", "$options": "i"}

        cursor = self.collection.find(query)
        pandals = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            # Ensure distance field exists
            if doc.get("nearest_metro"):
                if not doc["nearest_metro"].get("distance"):
                    doc["nearest_metro"]["distance"] = "Nearby"
            pandals.append(doc)

        await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
        return pandals

    async def get_train_stations(self) -> List[Dict]:
        """Aggregate all distinct railway stations with pandal counts (cached)."""
        cache_key = "cache:transit:train:stations"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        pipeline = [
            {"$match": {"nearest_stations": {"$exists": True, "$ne": []}}},
            {"$unwind": "$nearest_stations"},
            {"$match": {"nearest_stations.name": {"$exists": True, "$ne": None}}},
            {
                "$group": {
                    "_id": "$nearest_stations.name",
                    "pandal_count": {"$sum": 1}
                }
            },
            {"$sort": {"pandal_count": -1, "_id": 1}}
        ]
        results = []
        async for doc in self.collection.aggregate(pipeline):
            results.append({
                "name": doc["_id"],
                "pandal_count": doc["pandal_count"]
            })

        await cache.set_json(cache_key, results, expire=settings.CACHE_TTL_TRANSIT)
        return results

    async def get_pandals_by_train(self, station_name: str) -> List[Dict]:
        """Get all pandals near a specific railway station (cached)."""
        clean_name = station_name.strip().lower()
        cache_key = f"cache:transit:train:{clean_name}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        escaped_name = re.escape(station_name.strip())
        query = {
            "nearest_stations.name": {"$regex": f"^{escaped_name}$", "$options": "i"}
        }
        cursor = self.collection.find(query)
        pandals = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            # Ensure distance field exists in the matched station
            if doc.get("nearest_stations"):
                for s in doc["nearest_stations"]:
                    if s.get("name") and s["name"].lower() == clean_name:
                        if not s.get("distance"):
                            s["distance"] = "Nearby"
            pandals.append(doc)

        await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
        return pandals
