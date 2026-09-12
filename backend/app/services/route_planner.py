"""
app/services/route_planner.py
------------------------------
A -> B Road Route-Based Puja Pandal Planner service and OSRM routing client.
Interacts with OSRM (Open Source Routing Machine) to fetch road geometry,
evaluates MongoDB candidate pandals against the route polyline,
and constructs ordered itineraries.
"""

from typing import Dict, List, Optional, Tuple
import httpx
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.schemas.route import (
    PointSchema,
    RoutePlanRequest,
    RoutePlanResponse,
    RouteItineraryItem,
    RouteGeometry,
)
from app.schemas.pandal import PandalResponse
from app.utils.geo import order_pandals_along_polyline


class OSRMClient:
    def __init__(self, base_url: Optional[str] = None, timeout: float = 10.0):
        self.base_url = (base_url or settings.OSRM_BASE_URL).rstrip("/")
        self.timeout = timeout

    async def get_route(
        self, origin: PointSchema, destination: PointSchema
    ) -> Tuple[List[List[float]], float]:
        """
        Query OSRM API for driving route geometry (GeoJSON LineString coordinates)
        and distance in km.
        """
        url = (
            f"{self.base_url}/route/v1/driving/"
            f"{origin.longitude},{origin.latitude};"
            f"{destination.longitude},{destination.latitude}"
            "?overview=full&geometries=geojson"
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url)
        except (httpx.RequestError, httpx.TimeoutException) as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Routing service unavailable: {str(e)}",
            )

        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Routing service returned status {res.status_code}: {res.text}",
            )

        data = res.json()
        if data.get("code") != "Ok" or not data.get("routes"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unable to calculate route between origin and destination: {data.get('message', 'No route found')}",
            )

        route = data["routes"][0]
        coordinates = route["geometry"]["coordinates"]
        distance_meters = route.get("distance", 0.0)
        distance_km = round(distance_meters / 1000.0, 2)

        return coordinates, distance_km


class RoutePlannerService:
    def __init__(
        self,
        db: AsyncIOMotorDatabase,
        osrm_client: Optional[OSRMClient] = None,
    ):
        self.collection = db[settings.PANDAL_COLLECTION_NAME]
        self.osrm_client = osrm_client or OSRMClient()

    async def plan_route(self, request: RoutePlanRequest) -> RoutePlanResponse:
        """
        Plan an A -> B road route Puja Parikrama itinerary.
        """
        # 1. Fetch road route geometry from OSRM
        coordinates, base_distance_km = await self.osrm_client.get_route(
            request.origin, request.destination
        )

        # 2. Query candidate pandals from MongoDB
        query = {}
        if request.region:
            query["region"] = {"$regex": request.region, "$options": "i"}
        if request.cluster:
            query["cluster"] = {"$regex": request.cluster, "$options": "i"}

        cursor = self.collection.find(query)
        candidates = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["id"] = doc["_id"]
            candidates.append(doc)

        # 3. Filter pandals within max_detour_km of polyline and order along route
        ordered_candidates = order_pandals_along_polyline(
            candidates,
            coordinates,
            max_detour_km=request.max_detour_km,
            origin=(request.origin.latitude, request.origin.longitude),
            destination=(request.destination.latitude, request.destination.longitude),
        )

        # 4. Limit to max_pandals
        selected_candidates = ordered_candidates[: request.max_pandals]

        # 5. Build itinerary items
        itinerary = []
        for idx, item in enumerate(selected_candidates, start=1):
            detour_dist = item.pop("detour_distance_km", 0.0)
            progress = item.pop("route_progress_ratio", 0.0)
            pandal_resp = PandalResponse(**item)
            itinerary.append(
                RouteItineraryItem(
                    step=idx,
                    pandal=pandal_resp,
                    detour_distance_km=detour_dist,
                    route_progress_ratio=progress,
                )
            )

        return RoutePlanResponse(
            origin=request.origin,
            destination=request.destination,
            total_pandals=len(itinerary),
            estimated_distance_km=base_distance_km,
            max_detour_km=request.max_detour_km,
            itinerary=itinerary,
            route_geometry=RouteGeometry(type="LineString", coordinates=coordinates),
        )
