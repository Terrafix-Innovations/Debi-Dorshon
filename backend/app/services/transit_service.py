import json
import re
from pathlib import Path
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.config import settings
from app.core.cache import cache


class TransitService:
    def __init__(self, db: Optional[AsyncIOMotorDatabase]):
        self.db = db
        self.collection = db[settings.PANDAL_COLLECTION_NAME] if db is not None else None
        self._raw_data = None

    def _get_raw_data(self) -> List[Dict]:
        if self._raw_data is None:
            search_paths = [
                Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "debi_dorshon.json",
                Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "debi_dorshon.json",
                Path("/app/data/processed/debi_dorshon.json"),
            ]
            for p in search_paths:
                if p.exists():
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            self._raw_data = json.load(f)
                        break
                    except Exception:
                        pass
            if self._raw_data is None:
                self._raw_data = []
        return self._raw_data

    def _get_metro_stations_dataset(self) -> Dict[str, Dict]:
        if not hasattr(self, "_metro_dataset") or self._metro_dataset is None:
            search_paths = [
                Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "metro_stations.json",
                Path(__file__).resolve().parent.parent.parent.parent / "data" / "processed" / "metro_stations.json",
                Path("/app/data/processed/metro_stations.json"),
            ]
            self._metro_dataset = {}
            for p in search_paths:
                if p.exists():
                    try:
                        with open(p, "r", encoding="utf-8") as f:
                            items = json.load(f)
                            for it in items:
                                self._metro_dataset[it["name"].lower()] = it
                                for a in it.get("aliases", []):
                                    self._metro_dataset[a.lower()] = it
                        break
                    except Exception:
                        pass
        return self._metro_dataset

    def _get_metro_stations_from_json(self) -> List[Dict]:
        data = self._get_raw_data()
        counts = {}
        lines = {}
        for d in data:
            m = d.get("nearest_metro")
            if m and m.get("name"):
                name = m["name"]
                counts[name] = counts.get(name, 0) + 1
                if name not in lines and m.get("line"):
                    lines[name] = m["line"]

        coords_map = self._get_metro_stations_dataset()
        results = []
        for name, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            entry = coords_map.get(name.lower(), {})
            loc = entry.get("location") or {}
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            results.append({
                "name": name,
                "line": lines.get(name) or entry.get("line"),
                "pandal_count": count,
                "latitude": lat,
                "longitude": lng,
                "location": {"latitude": lat, "longitude": lng} if lat and lng else None,
            })
        return results

    def _get_pandals_by_metro_from_json(self, station_name: str, line: Optional[str] = None) -> List[Dict]:
        clean_name = station_name.strip().lower()
        data = self._get_raw_data()
        pandals = []
        for idx, doc in enumerate(data):
            m = doc.get("nearest_metro")
            if m and m.get("name"):
                m_name = m["name"].strip().lower()
                if m_name == clean_name:
                    item = dict(doc)
                    item["_id"] = str(item.get("_id") or item.get("id") or f"json_m_{idx}")
                    item["id"] = item["_id"]
                    if not item.get("nearest_metro", {}).get("distance"):
                        item.setdefault("nearest_metro", {})["distance"] = "Nearby"
                    pandals.append(item)
        return pandals

    def _get_train_stations_from_json(self) -> List[Dict]:
        data = self._get_raw_data()
        counts = {}
        for d in data:
            for s in d.get("nearest_stations", []):
                if s.get("name"):
                    name = s["name"]
                    counts[name] = counts.get(name, 0) + 1
        results = [
            {"name": name, "pandal_count": count}
            for name, count in sorted(counts.items(), key=lambda x: x[1], reverse=True)
        ]
        return results

    def _get_pandals_by_train_from_json(self, station_name: str) -> List[Dict]:
        clean_name = station_name.strip().lower()
        data = self._get_raw_data()
        pandals = []
        for idx, doc in enumerate(data):
            matched = False
            for s in doc.get("nearest_stations", []):
                if s.get("name"):
                    s_name = s["name"].strip().lower()
                    if s_name == clean_name:
                        matched = True
                        break
            if matched:
                item = dict(doc)
                item["_id"] = str(item.get("_id") or item.get("id") or f"json_t_{idx}")
                item["id"] = item["_id"]
                for s in item.get("nearest_stations", []):
                    if not s.get("distance"):
                        s["distance"] = "Nearby"
                pandals.append(item)
        return pandals

    async def get_metro_stations(self) -> List[Dict]:
        """Aggregate all distinct metro stations with pandal counts and exact OSM GPS coordinates (cached)."""
        if self.collection is None or self.db is None:
            return self._get_metro_stations_from_json()

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

            if not results:
                return self._get_metro_stations_from_json()

            results.sort(key=lambda s: (-s["pandal_count"], s["name"]))
            await cache.set_json(cache_key, results, expire=settings.CACHE_TTL_TRANSIT)
            return results
        except Exception:
            return self._get_metro_stations_from_json()

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
            return self._get_pandals_by_metro_from_json(station_name, line)

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

            if not pandals:
                pandals = self._get_pandals_by_metro_from_json(station_name, line)

            await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
            return pandals
        except Exception:
            return self._get_pandals_by_metro_from_json(station_name, line)

    async def get_train_stations(self) -> List[Dict]:
        """Aggregate all distinct railway stations with pandal counts (cached)."""
        if self.collection is None:
            return self._get_train_stations_from_json()

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
        except Exception:
            return self._get_train_stations_from_json()

    async def get_pandals_by_train(self, station_name: str) -> List[Dict]:
        """Get all pandals near a specific railway station (cached)."""
        clean_name = station_name.strip().lower()
        cache_key = f"cache:transit:train:{clean_name}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached

        if self.collection is None:
            return self._get_pandals_by_train_from_json(station_name)

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

            if not pandals:
                pandals = self._get_pandals_by_train_from_json(station_name)

            await cache.set_json(cache_key, pandals, expire=settings.CACHE_TTL_STATION_PANDALS)
            return pandals
        except Exception:
            return self._get_pandals_by_train_from_json(station_name)
