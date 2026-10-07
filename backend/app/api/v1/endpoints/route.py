from typing import Any, Dict, List, Optional
import re
import uuid
import json
from pathlib import Path
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


_METRO_DATASET_CACHE = None
_PANDAL_DATASET_CACHE = None


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
    High-precision Kolkata autocomplete search:
    1. Kolkata Metro Stations & Transit Terminals (instant local match)
    2. Durga Puja Pandals (MongoDB & local repository dataset)
    3. Ola Maps Places Autocomplete (if key active)
    4. Bounded OpenStreetMap Nominatim (strictly bounded to Kolkata metro region, deduplicated)
    5. Photon (as fallback, strictly deduplicated without spam)
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
    seen_titles = set()
    q_low = trimmed.lower()

    # 1. Kolkata Metro Stations
    if db is not None:
        try:
            cursor = db[settings.METRO_COLLECTION_NAME].find({
                "$or": [
                    {"name": {"$regex": re.escape(trimmed), "$options": "i"}},
                    {"aliases": {"$regex": re.escape(trimmed), "$options": "i"}}
                ]
            }).limit(limit)
            async for station in cursor:
                s_name = station.get("name", "")
                loc = station.get("location") or {}
                lat = loc.get("latitude")
                lng = loc.get("longitude")
                if lat and lng:
                    title = f"{s_name} Metro Station"
                    title_key = title.lower()
                    coord_key = (round(float(lat), 4), round(float(lng), 4))
                    if title_key not in seen_titles and coord_key not in seen_coords:
                        seen_titles.add(title_key)
                        seen_coords.add(coord_key)
                        line_name = station.get("line", "Blue")
                        results.append({
                            "id": f"metro_{s_name.replace(' ', '_')}",
                            "title": title,
                            "subtitle": f"{line_name} Line • Kolkata Metro",
                            "latitude": float(lat),
                            "longitude": float(lng),
                            "category": "metro",
                            "badge": "🚇 Metro",
                        })
                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"Error querying metro stations from MongoDB: {e}")

    # 2. Durga Puja Pandals
    if len(results) < limit and db is not None:
        try:
            cursor = db[settings.PANDAL_COLLECTION_NAME].find({
                "$or": [
                    {"name": {"$regex": re.escape(trimmed), "$options": "i"}},
                    {"cluster": {"$regex": re.escape(trimmed), "$options": "i"}},
                ]
            }).limit(limit - len(results) + 2)
            async for doc in cursor:
                loc = doc.get("location") or {}
                lat = loc.get("latitude")
                lng = loc.get("longitude")
                if lat and lng:
                    title = doc.get("name", "")
                    title_key = title.lower()
                    coord_key = (round(float(lat), 4), round(float(lng), 4))
                    if title_key not in seen_titles and coord_key not in seen_coords:
                        seen_titles.add(title_key)
                        seen_coords.add(coord_key)
                        region = doc.get("region") or "Kolkata"
                        cluster = doc.get("cluster") or ""
                        sub = f"{region} • {cluster}" if cluster else region
                        results.append({
                            "id": str(doc.get("_id")),
                            "title": title,
                            "subtitle": sub,
                            "latitude": float(lat),
                            "longitude": float(lng),
                            "category": "pandal",
                            "badge": "🛕 Pandal",
                        })
                        if len(results) >= limit:
                            break
        except Exception as e:
            print(f"Error querying pandals from MongoDB: {e}")

    # 3. Live fetch locations from Ola Maps (if active) and Bounded OpenStreetMap
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

        # 3A. Ola Maps (if configured)
        ola_key = settings.OLA_MAPS_API_KEY
        if ola_key and len(results) < limit:
            try:
                ola_url = "https://api.olamaps.io/places/v1/autocomplete"
                ola_params = {
                    "input": trimmed,
                    "api_key": ola_key,
                    "location": "22.5726,88.3639",
                    "radius": "50000",
                }
                ola_headers = {
                    "X-Request-Id": str(uuid.uuid4()),
                    "User-Agent": "DebiDorshon/1.0",
                }
                res_ola = await client.get(ola_url, params=ola_params, headers=ola_headers, timeout=2.5)
                if res_ola.status_code == 200:
                    ola_data = res_ola.json()
                    preds = ola_data.get("predictions", [])
                    for pred in preds:
                        sf = pred.get("structured_formatting") or {}
                        main_t = sf.get("main_text") or pred.get("description", "")
                        sec_t = sf.get("secondary_text") or "Kolkata, West Bengal"
                        place_id = pred.get("place_id")

                        lat, lng = None, None
                        geom = pred.get("geometry", {})
                        if geom and "location" in geom:
                            lat = geom["location"].get("lat")
                            lng = geom["location"].get("lng")
                        elif place_id:
                            try:
                                det_url = "https://api.olamaps.io/places/v1/details"
                                det_res = await client.get(
                                    det_url,
                                    params={"place_id": place_id, "api_key": ola_key},
                                    headers=ola_headers,
                                    timeout=1.5,
                                )
                                if det_res.status_code == 200:
                                    det_geom = det_res.json().get("result", {}).get("geometry", {}).get("location", {})
                                    lat = det_geom.get("lat")
                                    lng = det_geom.get("lng")
                            except Exception:
                                pass

                        if lat is not None and lng is not None:
                            key = (round(float(lat), 4), round(float(lng), 4))
                            title_key = main_t.lower()
                            if key not in seen_coords and title_key not in seen_titles:
                                seen_coords.add(key)
                                seen_titles.add(title_key)
                                cat, badge = classify_place(main_t, sec_t)
                                results.append({
                                    "id": f"ola_{place_id or len(results)}",
                                    "title": main_t,
                                    "subtitle": sec_t,
                                    "latitude": float(lat),
                                    "longitude": float(lng),
                                    "category": cat,
                                    "badge": badge,
                                })
                                if len(results) >= limit:
                                    break
            except Exception:
                pass

        # 3B. Bounded OpenStreetMap Nominatim (Precise Kolkata locations, temples, areas, landmarks)
        if len(results) < limit:
            try:
                nom_params = {
                    "q": trimmed,
                    "format": "jsonv2",
                    "addressdetails": "1",
                    "extratags": "1",
                    "countrycodes": "in",
                    "viewbox": "88.20,22.75,88.55,22.40",
                    "bounded": "1",
                    "limit": str(limit - len(results) + 3),
                }
                res_nom = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=nom_params,
                    headers=nom_headers,
                    timeout=3.0,
                )
                if res_nom.status_code == 200:
                    for item in res_nom.json():
                        lat_str = item.get("lat")
                        lon_str = item.get("lon")
                        if lat_str and lon_str:
                            lat, lng = float(lat_str), float(lon_str)
                            coord_key = (round(lat, 4), round(lng, 4))
                            raw_display = item.get("display_name", "")
                            parts = [p.strip() for p in raw_display.split(",") if p.strip()]
                            name_val = parts[0] if parts else trimmed
                            title_key = name_val.lower()

                            if coord_key not in seen_coords and title_key not in seen_titles:
                                seen_coords.add(coord_key)
                                seen_titles.add(title_key)
                                sub_parts = [p for p in parts[1:3] if p and not p.isdigit() and len(p) > 2]
                                sub_clean = ", ".join(sub_parts) or "Kolkata, West Bengal"
                                osm_type = item.get("type", "")
                                category, badge = classify_place(name_val, sub_clean, osm_type, item.get("class", ""))
                                results.append({
                                    "id": f"nom_{item.get('place_id', len(results))}",
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

        # 3C. Photon API (Only as fallback, with strict deduplication to prevent repeated dummy items)
        if len(results) < limit:
            try:
                photon_url = "https://photon.komoot.io/api/"
                photon_params = {
                    "q": trimmed,
                    "lat": "22.5726",
                    "lon": "88.3639",
                    "limit": str(min(8, limit - len(results) + 4)),
                }
                res_ph = await client.get(photon_url, params=photon_params, headers=browser_headers, timeout=2.5)
                if res_ph.status_code == 200:
                    features = res_ph.json().get("features", [])
                    for f in features:
                        coords = f.get("geometry", {}).get("coordinates", [])
                        if len(coords) == 2:
                            lng, lat = float(coords[0]), float(coords[1])
                            coord_key = (round(lat, 4), round(lng, 4))
                            props = f.get("properties", {})
                            name_val = props.get("name") or props.get("street") or ""
                            title_key = name_val.lower().strip()

                            # Discard untitled or duplicate features (like repeated 'Kali' dummy shrines)
                            if not name_val or title_key in seen_titles or coord_key in seen_coords:
                                continue

                            sub_parts = [p for p in [props.get("district"), props.get("city"), props.get("state")] if p]
                            sub_clean = ", ".join(sub_parts) or "Kolkata Region"

                            category, badge = classify_place(name_val, sub_clean, str(props.get("osm_value") or ""), str(props.get("osm_type") or ""))
                            seen_coords.add(coord_key)
                            seen_titles.add(title_key)
                            results.append({
                                "id": f"osm_ph_{props.get('osm_id', len(results))}",
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
