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
from app.core.http_client import get_http_client
from app.core.cache import cache
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
        and distance in km with caching and connection pooling.
        """
        cache_key = (
            f"cache:osrm:route:{round(origin.latitude, 4)},{round(origin.longitude, 4)}"
            f"->{round(destination.latitude, 4)},{round(destination.longitude, 4)}"
        )
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached["coordinates"], cached["distance_km"]

        url = (
            f"{self.base_url}/route/v1/driving/"
            f"{origin.longitude},{origin.latitude};"
            f"{destination.longitude},{destination.latitude}"
            "?overview=full&geometries=geojson"
        )

        try:
            client = get_http_client()
            res = await client.get(url, timeout=self.timeout)
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

        await cache.set_json(
            cache_key,
            {"coordinates": coordinates, "distance_km": distance_km},
            expire=settings.CACHE_TTL_ROUTE_PLAN,
        )

        return coordinates, distance_km

    async def get_multi_stop_route(
        self, waypoints: List[Tuple[float, float]]
    ) -> Optional[Tuple[List[List[float]], float]]:
        """
        Query OSRM API for driving route geometry passing through all waypoints in sequence.
        waypoints: List of (longitude, latitude) tuples [Start, Stop 1, Stop 2, ..., End].
        Returns (coordinates, distance_km) or None if calculation fails.
        """
        if len(waypoints) < 2:
            return None

        # OSRM expects {longitude},{latitude};{longitude},{latitude}...
        coords_str = ";".join(f"{round(lng, 6)},{round(lat, 6)}" for lng, lat in waypoints)
        cache_key = f"cache:osrm:multi:{coords_str}"
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return cached["coordinates"], cached["distance_km"]

        url = (
            f"{self.base_url}/route/v1/driving/{coords_str}"
            "?overview=full&geometries=geojson"
        )

        try:
            client = get_http_client()
            res = await client.get(url, timeout=self.timeout)
            if res.status_code == 200:
                data = res.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    coordinates = route["geometry"]["coordinates"]
                    distance_meters = route.get("distance", 0.0)
                    distance_km = round(distance_meters / 1000.0, 2)
                    await cache.set_json(
                        cache_key,
                        {"coordinates": coordinates, "distance_km": distance_km},
                        expire=settings.CACHE_TTL_ROUTE_PLAN,
                    )
                    return coordinates, distance_km
        except Exception:
            pass

        return None


class RoutePlannerService:
    def __init__(
        self,
        db: Optional[AsyncIOMotorDatabase] = None,
        osrm_client: Optional[OSRMClient] = None,
    ):
        self.collection = db[settings.PANDAL_COLLECTION_NAME] if db is not None else None
        self.osrm_client = osrm_client or OSRMClient()

    async def plan_route(self, request: RoutePlanRequest) -> RoutePlanResponse:
        """
        Plan an A -> B road route Puja Parikrama itinerary with Redis result caching.
        """
        cache_key = (
            f"cache:route:plan:{round(request.origin.latitude, 4)},{round(request.origin.longitude, 4)}"
            f"->{round(request.destination.latitude, 4)},{round(request.destination.longitude, 4)}"
            f":{request.max_detour_km}:{request.max_pandals or 'all'}:{request.region or ''}:{request.cluster or ''}"
        )
        cached = await cache.get_json(cache_key)
        if cached is not None:
            return RoutePlanResponse(**cached)

        # 1. Fetch base road route geometry from OSRM to establish corridor
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

        # 4. Limit to max_pandals if provided, otherwise return all pandals along route
        if request.max_pandals is not None:
            selected_candidates = ordered_candidates[: request.max_pandals]
        else:
            selected_candidates = ordered_candidates

        # 5. Generate Curated Google Maps-style Road Route from S -> 1 -> 2 -> ... -> E
        final_coordinates = coordinates
        final_distance_km = base_distance_km

        if selected_candidates:
            waypoints = [(request.origin.longitude, request.origin.latitude)]
            for item in selected_candidates:
                loc = item.get("location") or {}
                p_lng = loc.get("longitude")
                p_lat = loc.get("latitude")
                if p_lng is not None and p_lat is not None:
                    waypoints.append((float(p_lng), float(p_lat)))
            waypoints.append((request.destination.longitude, request.destination.latitude))

            # Query multi-stop curated road route
            multi_route = await self.osrm_client.get_multi_stop_route(waypoints)
            if multi_route:
                final_coordinates, final_distance_km = multi_route

        # 6. Build itinerary items
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

        response = RoutePlanResponse(
            origin=request.origin,
            destination=request.destination,
            total_pandals=len(itinerary),
            estimated_distance_km=final_distance_km,
            max_detour_km=request.max_detour_km,
            itinerary=itinerary,
            route_geometry=RouteGeometry(type="LineString", coordinates=final_coordinates),
        )

        await cache.set_json(cache_key, response.model_dump(), expire=settings.CACHE_TTL_ROUTE_PLAN)
        return response
