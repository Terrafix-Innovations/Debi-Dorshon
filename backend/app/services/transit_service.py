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


class TransitService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db[settings.PANDAL_COLLECTION_NAME]

    async def get_metro_stations(self) -> List[Dict]:
        """Aggregate all distinct metro stations with pandal counts."""
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
        return results

    async def get_pandals_by_metro(
        self, station_name: str, line: Optional[str] = None
    ) -> List[Dict]:
        """Get all pandals near a specific metro station."""
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
            pandals.append(doc)
        return pandals

    async def get_train_stations(self) -> List[Dict]:
        """Aggregate all distinct railway stations with pandal counts."""
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
        return results

    async def get_pandals_by_train(self, station_name: str) -> List[Dict]:
        """Get all pandals near a specific railway station."""
        escaped_name = re.escape(station_name.strip())
        query = {
            "nearest_stations.name": {"$regex": f"^{escaped_name}$", "$options": "i"}
        }
        cursor = self.collection.find(query)
        pandals = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            pandals.append(doc)
        return pandals
