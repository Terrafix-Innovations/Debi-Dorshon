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

    # Determine if query is explicitly a transit/metro search
    transit_keywords = ["metro", "station", "railway", "train", "terminus", "terminal"]
    is_transit_search = any(w in trimmed.lower() for w in transit_keywords)

    # 1. Search local MongoDB STRICTLY for Durga Puja Pandals only by pandal name (NEVER for transit queries)
    if not is_transit_search and db is not None:
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
                        sub_parts = [region]
                        if cluster:
                            sub_parts.append(cluster)
                        results.append({
                            "id": str(doc.get("_id")),
                            "title": doc.get("name"),
                            "subtitle": " • ".join(sub_parts),
                            "latitude": float(lat),
                            "longitude": float(lng),
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
                "limit": str(min(10, remaining_slots + 4)),
            }
            res_sb = await client.get(sb_url, params=sb_params, timeout=3.5)
            if res_sb.status_code == 200:
                sugs = res_sb.json().get("suggestions", [])
                candidates = []
                for s in sugs:
                    maki = str(s.get("maki") or "").lower()
                    name = str(s.get("name") or "")
                    n_low = name.lower()
                    if is_transit_search:
                        if any(bad in n_low for bad in ["co-operative", "housing", "bypass", "gali", "guest house", "plaza", "optician", "lodge", "hotel", "shop", "pg", "medplus"]):
                            continue
                        if maki in ["lodging", "hospital", "optician", "shop"]:
                            continue
                    candidates.append(s)

                def rank_candidate(s):
                    maki = str(s.get("maki") or "").lower()
                    name = str(s.get("name") or "")
                    n_low = name.lower()
                    is_gate = "gate" in n_low or "get" in n_low
                    is_stn = "station" in n_low
                    if is_stn and not is_gate:
                        return 0
                    elif is_stn or "rail" in maki or "transit" in maki:
                        return 1
                    return 2

                if is_transit_search:
                    candidates.sort(key=rank_candidate)

                for s in candidates:
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
                                    name_val = s.get("name") or f.get("properties", {}).get("name") or ""
                                    if name_val.islower():
                                        name_val = name_val.title()
                                    results.append({
                                        "id": f"mapbox_sb_{mid}",
                                        "title": name_val,
                                        "subtitle": full_addr,
                                        "latitude": lat,
                                        "longitude": lng,
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
                                text = f.get("text") or f.get("place_name", "").split(",")[0]
                                full = f.get("place_name", "")
                                text_low = (text + " " + full).lower()
                                if is_transit_search and any(bad in text_low for bad in ["co-operative", "housing", "bypass", "gali", "plaza", "optician", "shop", "floor"]):
                                    continue
                                seen_coords.add(key)
                                results.append({
                                    "id": f.get("id"),
                                    "title": text,
                                    "subtitle": full,
                                    "latitude": lat,
                                    "longitude": lng,
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
