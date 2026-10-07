import re
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.cache import cache


class TransitService:
    def __init__(self, db: Optional[AsyncIOMotorDatabase]):
        self.db = db
        self.collection = db[settings.PANDAL_COLLECTION_NAME] if db is not None else None

    async def get_metro_stations(self) -> List[Dict]:
        """Aggregate all distinct metro stations with pandal counts and exact OSM GPS coordinates (cached)."""
        if self.collection is None or self.db is None:
            return []

        cache_key = "cache:transit:metro:stations:v2"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached
        try:
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
            counts_map = {}
            async for doc in self.collection.aggregate(pipeline):
                st_name = doc["_id"]["name"]
                counts_map[st_name.lower()] = {
                    "line": doc["_id"].get("line"),
                    "count": doc["pandal_count"],
                }

            metro_col = self.db[getattr(settings, "METRO_COLLECTION_NAME", "metro_stations")]
            results = []
            seen = set()

            async for m_doc in metro_col.find({}).sort("name", 1):
                m_name = m_doc["name"]
                m_lower = m_name.lower()
                p_info = counts_map.get(m_lower)
                if not p_info:
                    for alias in m_doc.get("aliases", []):
                        if alias.lower() in counts_map:
                            p_info = counts_map[alias.lower()]
                            break

                p_count = p_info["count"] if p_info else m_doc.get("pandal_count", 0)
                line = p_info.get("line") if p_info and p_info.get("line") else m_doc.get("line")
                loc = m_doc.get("location") or {}
                lat = loc.get("latitude") or m_doc.get("latitude")
                lng = loc.get("longitude") or m_doc.get("longitude")

                results.append({
                    "name": m_name,
                    "line": line,
                    "pandal_count": p_count,
                    "latitude": lat,
                    "longitude": lng,
                    "location": {"latitude": lat, "longitude": lng} if lat and lng else None,
                })
                seen.add(m_lower)

            results.sort(key=lambda s: (-s["pandal_count"], s["name"]))
            await cache.set_json(cache_key, results, expire=settings.CACHE_TTL_TRANSIT)
            return results
        except Exception as e:
            print(f"Error querying metro stations: {e}")
            return []

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

        if self.collection is None:
            return []

        try:
            escaped_name = re.escape(station_name.strip())
            query = {
                "nearest_metro.name": {"$regex": f"^{escaped_name}$", "$options": "i"}
            }
            if line:
                clean_line_str = line.strip().replace(" Line", "").replace(" line", "")
                escaped_line = re.escape(clean_line_str)
                query["nearest_metro.line"] = {"$regex": f"^{escaped_line}", "$options": "i"}

            cursor = self.collection.find(query)
            pandals = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                doc["id"] = doc["_id"]
                if doc.get("nearest_metro"):
                    if not doc["nearest_metro"].get("distance"):
                        doc["nearest_metro"]["distance"] = "Nearby"
                pandals.append(doc)

            await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
            return pandals
        except Exception as e:
            print(f"Error querying pandals by metro: {e}")
            return []

    async def get_train_stations(self) -> List[Dict]:
        """Aggregate all distinct railway stations with pandal counts (cached)."""
        if self.collection is None:
            return []

        cache_key = "cache:transit:train:stations"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        try:
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
        except Exception as e:
            print(f"Error querying train stations: {e}")
            return []

    async def get_pandals_by_train(self, station_name: str) -> List[Dict]:
        """Get all pandals near a specific railway station (cached)."""
        clean_name = station_name.strip().lower()
        cache_key = f"cache:transit:train:{clean_name}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        if self.collection is None:
            return []

        try:
            escaped_name = re.escape(station_name.strip())
            query = {
                "nearest_stations.name": {"$regex": f"^{escaped_name}$", "$options": "i"}
            }
            cursor = self.collection.find(query)
            pandals = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                doc["id"] = doc["_id"]
                if doc.get("nearest_stations"):
                    for s in doc["nearest_stations"]:
                        if s.get("name") and s["name"].lower() == clean_name:
                            if not s.get("distance"):
                                s["distance"] = "Nearby"
                pandals.append(doc)

            await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
            return pandals
        except Exception as e:
            print(f"Error querying pandals by train: {e}")
            return []
