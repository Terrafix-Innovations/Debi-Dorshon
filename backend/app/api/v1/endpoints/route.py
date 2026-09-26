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
        "map_provider": settings.MAP_PROVIDER,
        "mapbox_configured": is_configured,
        "mapbox_token": token if is_configured else None,
        "default_center": [88.375, 22.595],
        "default_zoom": 13,
    }


def classify_place(name: str, display_name: str, osm_value: str = "", osm_type: str = "") -> tuple:
    """
    Classifies a location into a user-friendly category and badge like Google Maps:
    Returns (category, badge)
    """
    text = f"{name} {display_name} {osm_value} {osm_type}".lower()

    # 1. Metro
    if "metro" in text or osm_value in ["subway", "subway_entrance", "light_rail"] or osm_type in ["subway", "subway_entrance"]:
        return "metro", "🚇 Metro Station"

    # 2. Train / Railway
    if "railway" in text or "junction" in text or "terminus" in text or (("station" in text or osm_value in ["station", "halt"]) and "metro" not in text):
        return "train", "🚆 Railway Station"

    # 3. Airport
    if "airport" in text or "aerodrome" in text or osm_value in ["aerodrome", "airport"]:
        return "airport", "✈️ Airport"

    # 4. Ferry / River Ghat
    if "ferry" in text or "ghat" in text or osm_value == "ferry_terminal":
        return "ferry", "⛴️ Ferry Ghat"

    # 5. Bus Station / Terminus
    if "bus" in text or osm_value in ["bus_station", "bus_stop"]:
        return "bus", "🚌 Bus Stand"

    # 6. Landmark / Monument / Cultural / Park
    if any(k in text for k in ["memorial", "monument", "museum", "temple", "mandir", "masjid", "church", "park", "garden", "stadium", "mall", "university", "college", "hospital", "bhavan"]) or osm_type in ["tourism", "historic", "attraction"]:
        return "landmark", "🏛️ Landmark"

    # 7. Street / Highway
    if any(k in text for k in ["road", "street", "sarani", "lane", "avenue", "highway", "bypass", "flyover"]):
        return "street", "🛣️ Street / Road"

    return "place", "📍 Place"


@router.get(
    "/autocomplete",
    summary="Search places and pandals live via OpenStreetMap and MongoDB",
)
@limiter.limit(settings.RATE_LIMIT_AUTOCOMPLETE)
async def autocomplete_places(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(6, ge=1, le=10, description="Max suggestions to return"),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> List[Dict[str, Any]]:
    """
    Live place & transit search proxy like Google Maps:
    1. Pandals: Fetched from the MongoDB Durga Puja database.
    2. All other locations (Metro stations, Train stations, Bus stands, Ferry ghats,
       Landmarks, Streets, Addresses): Live fetched from OpenStreetMap (Photon & Nominatim).
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

    # Determine if query is transit-oriented
    transit_keywords = ["metro", "station", "railway", "train", "terminus", "terminal", "airport", "ghat", "bus"]
    is_transit_search = any(w in trimmed.lower() for w in transit_keywords)

    # 1. Search MongoDB for Durga Puja Pandals (unless explicitly a transit-only search)
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
                    key = (round(lat, 4), round(lng, 4))
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
                            "category": "pandal",
                            "badge": "🛕 Pandal",
                        })
        except Exception:
            pass

    # 2. Live fetch ALL other locations from OpenStreetMap (Photon & Nominatim)
    if len(results) < limit:
        client = get_http_client()
        browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
        }
        nom_headers = {
            "User-Agent": "DebiDorshon-LiveSearch/1.0 (https://github.com/Debi-Dorshon)",
            "Accept": "application/json",
        }

        # A. OpenStreetMap Photon API (instant autocomplete biased to Kolkata coordinates)
        try:
            photon_url = "https://photon.komoot.io/api/"
            photon_params = {
                "q": trimmed,
                "lat": "22.5726",
                "lon": "88.3639",
                "limit": str(min(10, limit - len(results) + 4)),
            }
            res_ph = await client.get(photon_url, params=photon_params, headers=browser_headers, timeout=3.0)
            if res_ph.status_code == 200:
                features = res_ph.json().get("features", [])
                for f in features:
                    coords = f.get("geometry", {}).get("coordinates", [])
                    if len(coords) == 2:
                        lng, lat = float(coords[0]), float(coords[1])
                        key = (round(lat, 4), round(lng, 4))
                        if key not in seen_coords:
                            props = f.get("properties", {})
                            name_val = props.get("name") or props.get("street") or trimmed
                            osm_val = str(props.get("osm_value") or "")
                            osm_type = str(props.get("osm_type") or "")

                            sub_parts = [
                                props.get("district"),
                                props.get("city"),
                                props.get("state"),
                            ]
                            sub_clean = ", ".join([p for p in sub_parts if p]) or "Kolkata Region"

                            category, badge = classify_place(name_val, sub_clean, osm_val, osm_type)
                            seen_coords.add(key)
                            results.append({
                                "id": f"osm_ph_{props.get('osm_id', round(lat, 4))}",
                                "title": name_val,
                                "subtitle": sub_clean,
                                "latitude": lat,
                                "longitude": lng,
                                "category": category,
                                "badge": badge,
                            })
                            if len(results) >= limit:
                                break
        except Exception:
            pass

        # B. OpenStreetMap Nominatim API (precise named stations, landmarks, airports, roads)
        if len(results) < limit:
            try:
                nom_params = {
                    "q": trimmed,
                    "format": "jsonv2",
                    "addressdetails": "1",
                    "extratags": "1",
                    "countrycodes": "in",
                    "viewbox": "88.0,22.85,88.6,22.25",
                    "bounded": "0",
                    "limit": str(limit - len(results)),
                }
                res_nom = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=nom_params,
                    headers=nom_headers,
                    timeout=3.5,
                )
                if res_nom.status_code == 200:
                    for item in res_nom.json():
                        lat_str = item.get("lat")
                        lon_str = item.get("lon")
                        if lat_str and lon_str:
                            lat, lng = float(lat_str), float(lon_str)
                            key = (round(lat, 4), round(lng, 4))
                            if key not in seen_coords:
                                name_val = item.get("name") or item.get("display_name", "").split(",")[0]
                                full_addr = item.get("display_name", "")
                                osm_type = str(item.get("type") or "")
                                osm_class = str(item.get("class") or "")

                                category, badge = classify_place(name_val, full_addr, osm_type, osm_class)
                                seen_coords.add(key)
                                results.append({
                                    "id": f"osm_nom_{item.get('place_id')}",
                                    "title": name_val,
                                    "subtitle": full_addr,
                                    "latitude": lat,
                                    "longitude": lng,
                                    "category": category,
                                    "badge": badge,
                                })
                                if len(results) >= limit:
                                    break
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
