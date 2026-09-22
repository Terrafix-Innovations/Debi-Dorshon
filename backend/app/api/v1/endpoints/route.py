from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, Depends, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_database
from app.core.cache import cache
from app.core.http_client import get_http_client
from app.core.rate_limit import limiter
from app.schemas.route import RoutePlanRequest, RoutePlanResponse
from app.services.route_planner import RoutePlannerService
from app.core.transit_data import search_kolkata_transit_hubs

router = APIRouter()


def get_route_planner_service(
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> RoutePlannerService:
    return RoutePlannerService(db)


@router.get(
    "/config",
    summary="Get public map configuration from backend",
)
async def get_map_config() -> Dict[str, Any]:
    """
    Returns public mapping configuration. The Mapbox token is managed centrally
    in backend/.env and delivered securely without hardcoding in frontend files.
    """
    token = settings.MAPBOX_ACCESS_TOKEN
    is_configured = bool(token and token.startswith("pk.") and "your_" not in token)
    return {
        "mapbox_configured": is_configured,
        "mapbox_token": token if is_configured else None,
        "default_center": [88.375, 22.595],
        "default_zoom": 13,
    }


@router.get(
    "/autocomplete",
    summary="Search places and pandals securely via backend proxy",
)
@limiter.limit(settings.RATE_LIMIT_AUTOCOMPLETE)
async def autocomplete_places(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(6, ge=1, le=10, description="Max suggestions to return"),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> List[Dict[str, Any]]:
    """
    Server-side geocoding & place search proxy.
    Keeps Mapbox credentials strictly on the backend, while combining
    external Mapbox place geocoding with local Durga Puja Pandals from MongoDB.
    """
    trimmed = q.strip()
    if not trimmed:
        return []

    cache_key = f"cache:autocomplete:{trimmed.lower()}:{limit}"
    cached = await cache.get_json(cache_key)
    if cached is not None:
        return cached

    results: List[Dict[str, Any]] = []
    seen_coords = set()

    # 1. Check curated Kolkata Metro Stations and Major Transit Hubs
    metro_matches = search_kolkata_transit_hubs(trimmed, limit=4)
    for m in metro_matches:
        key = (round(m["latitude"], 4), round(m["longitude"], 4))
        if key not in seen_coords:
            seen_coords.add(key)
            results.append(m)

    # 2. Search local MongoDB Pandals (Exact matching)
    try:
        cursor = db[settings.PANDAL_COLLECTION_NAME].find(
            {"name": {"$regex": trimmed, "$options": "i"}}
        ).limit(4)
        async for doc in cursor:
            loc = doc.get("location") or {}
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            if lat and lng:
                key = (round(lat, 4), round(lng, 4))
                if key not in seen_coords:
                    seen_coords.add(key)
                    region = doc.get("region") or "Kolkata"
                    cluster = doc.get("cluster") or ""
                    metro = doc.get("nearest_metro", {}).get("name", "") if doc.get("nearest_metro") else ""
                    sub_parts = [region]
                    if cluster:
                        sub_parts.append(cluster)
                    if metro:
                        sub_parts.append(f"Metro: {metro}")
                    results.append({
                        "id": str(doc.get("_id")),
                        "title": doc.get("name"),
                        "subtitle": " • ".join(sub_parts),
                        "latitude": lat,
                        "longitude": lng,
                        "category": "pandal",
                        "badge": "🛕 Pandal",
                    })
    except Exception:
        pass

    # 2. Query Mapbox Geocoding using backend token
    token = settings.MAPBOX_ACCESS_TOKEN
    if token and token.startswith("pk.") and "your_" not in token:
        try:
            url = (
                f"https://api.mapbox.com/geocoding/v5/mapbox.places/{httpx.URL(trimmed).raw_path.decode('utf-8')}.json"
            )
            params = {
                "access_token": token,
                "country": "IN",
                "proximity": "88.3639,22.5726",
                "bbox": "88.15,22.35,88.55,22.75",
                "types": "poi,address,neighborhood,locality,place",
                "limit": str(limit),
            }
            client = get_http_client()
            res = await client.get(
                f"https://api.mapbox.com/geocoding/v5/mapbox.places/{trimmed}.json",
                params=params,
                timeout=4.0,
            )
            if res.status_code == 200:
                data = res.json()
                for f in data.get("features", []):
                    center = f.get("center", [])
                    if len(center) == 2:
                        lng, lat = center[0], center[1]
                        key = (round(lat, 4), round(lng, 4))
                        if key not in seen_coords:
                            seen_coords.add(key)
                            text = f.get("text") or f.get("place_name", "").split(",")[0]
                            is_metro = "metro" in text.lower()
                            results.append({
                                "id": f.get("id"),
                                "title": text,
                                "subtitle": f.get("place_name"),
                                "latitude": lat,
                                "longitude": lng,
                                "category": "metro" if is_metro else "place",
                                "badge": "🚇 Metro" if is_metro else "📍 Place",
                            })
        except Exception:
            pass

    final_results = results[:limit]
    await cache.set_json(cache_key, final_results, expire=settings.CACHE_TTL_AUTOCOMPLETE)
    return final_results


@router.post(
    "/plan",
    response_model=RoutePlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Plan an A -> B road route Puja Parikrama itinerary",
)
@limiter.limit(settings.RATE_LIMIT_ROUTE_PLAN)
async def plan_route(
    request: Request,
    route_plan_request: RoutePlanRequest,
    service: RoutePlannerService = Depends(get_route_planner_service),
):
    """
    Plan a Puja Parikrama itinerary along an actual road route from Point A (origin) to Point B (destination).

    - Obtains road route geometry from OSRM routing engine.
    - Filters candidate pandals within 1.0 km (or custom `max_detour_km`) of the road polyline.
    - Orders selected pandals sequentially along the path of travel from Point A toward Point B.
    - Returns full route polyline geometry for map rendering.
    """
    return await service.plan_route(route_plan_request)
