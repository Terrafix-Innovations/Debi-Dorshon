from typing import Any, Dict, List, Optional
import re
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

    # 1. Search local MongoDB STRICTLY for Durga Puja Pandals only
    try:
        cursor = db[settings.PANDAL_COLLECTION_NAME].find(
            {"name": {"$regex": re.escape(trimmed), "$options": "i"}}
        ).limit(limit)
        async for doc in cursor:
            loc = doc.get("location") or {}
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            if lat and lng:
                key = (round(lat, 5), round(lng, 5))
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
                        "latitude": float(lat),
                        "longitude": float(lng),
                        "category": "pandal",
                        "badge": "🛕 Pandal",
                    })
    except Exception:
        pass

    # 2. Fetch everything else (metro stations, transit hubs, places, addresses) in real-time from Mapbox Live Map API
    token = settings.MAPBOX_ACCESS_TOKEN
    if token and token.startswith("pk.") and "your_" not in token:
        client = get_http_client()
        remaining_slots = max(1, limit - len(results))

        # A. Mapbox SearchBox API: High-precision real-time transit & metro station search
        try:
            sb_url = "https://api.mapbox.com/search/searchbox/v1/suggest"
            sb_params = {
                "q": trimmed,
                "access_token": token,
                "session_token": "00000000-0000-0000-0000-000000000001",
                "proximity": "88.3639,22.5726",
                "bbox": "88.15,22.35,88.55,22.75",
                "limit": str(remaining_slots),
            }
            res_sb = await client.get(sb_url, params=sb_params, timeout=3.5)
            if res_sb.status_code == 200:
                sugs = res_sb.json().get("suggestions", [])
                for s in sugs:
                    maki = str(s.get("maki") or "").lower()
                    name = str(s.get("name") or "")
                    # Filter out commercial lodgings/shops if searching for transit
                    if maki in ("lodging", "hospital", "optician", "shop") and any(w in trimmed.lower() for w in ["metro", "station"]):
                        continue

                    mid = s.get("mapbox_id")
                    if not mid:
                        continue

                    ret_url = f"https://api.mapbox.com/search/searchbox/v1/retrieve/{mid}"
                    ret_res = await client.get(
                        ret_url,
                        params={"access_token": token, "session_token": "00000000-0000-0000-0000-000000000001"},
                        timeout=3.0,
                    )
                    if ret_res.status_code == 200:
                        feats = ret_res.json().get("features", [])
                        if feats:
                            f = feats[0]
                            coords = f.get("geometry", {}).get("coordinates", [])
                            if len(coords) == 2:
                                lng, lat = float(coords[0]), float(coords[1])
                                key = (round(lat, 5), round(lng, 5))
                                if key not in seen_coords:
                                    seen_coords.add(key)
                                    full_addr = f.get("properties", {}).get("full_address") or s.get("place_formatted") or ""
                                    is_metro = (
                                        "rail" in maki
                                        or any(t in (name + " " + full_addr).lower() for t in ["metro", "subway", "railway station"])
                                    )
                                    results.append({
                                        "id": f"mapbox_sb_{mid}",
                                        "title": name,
                                        "subtitle": full_addr,
                                        "latitude": lat,
                                        "longitude": lng,
                                        "category": "metro" if is_metro else "place",
                                        "badge": "🚇 Metro" if is_metro else "📍 Place",
                                    })
                                    if len(results) >= limit:
                                        break
        except Exception:
            pass

        # B. Mapbox Geocoding v5 API: Real-time POI, locality, neighborhood, and address search
        if len(results) < limit:
            try:
                gc_params = {
                    "access_token": token,
                    "country": "IN",
                    "proximity": "88.3639,22.5726",
                    "bbox": "88.15,22.35,88.55,22.75",
                    "limit": str(limit - len(results)),
                }
                res_gc = await client.get(
                    f"https://api.mapbox.com/geocoding/v5/mapbox.places/{trimmed}.json",
                    params=gc_params,
                    timeout=3.5,
                )
                if res_gc.status_code == 200:
                    for f in res_gc.json().get("features", []):
                        center = f.get("center", [])
                        if len(center) == 2:
                            lng, lat = float(center[0]), float(center[1])
                            key = (round(lat, 5), round(lng, 5))
                            if key not in seen_coords:
                                seen_coords.add(key)
                                text = f.get("text") or f.get("place_name", "").split(",")[0]
                                full = f.get("place_name", "")
                                is_metro = any(t in (text + " " + full).lower() for t in ["metro", "station", "subway"])
                                results.append({
                                    "id": f.get("id"),
                                    "title": text,
                                    "subtitle": full,
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
