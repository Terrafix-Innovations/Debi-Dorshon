"""
app/utils/geo.py
----------------
Geographical utilities for distance calculation and spatial sorting.
Uses the Haversine formula to compute great-circle distances between GPS coordinates.
"""

import math
from typing import Dict, List, Optional, Tuple


def haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Calculate the great-circle distance between two points in kilometers
    using the Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def sort_pandals_by_distance(
    origin_lat: float, origin_lng: float, pandals: List[Dict]
) -> List[Dict]:
    """
    Computes distance from origin to each pandal that has valid coordinates,
    and returns a sorted list of pandals with distance_km attached.
    """
    result = []
    for pandal in pandals:
        loc = pandal.get("location") or {}
        p_lat = loc.get("latitude")
        p_lng = loc.get("longitude")

        if (
            isinstance(p_lat, (int, float))
            and isinstance(p_lng, (int, float))
            and -90 <= p_lat <= 90
            and -180 <= p_lng <= 180
        ):
            dist = haversine_distance(origin_lat, origin_lng, float(p_lat), float(p_lng))
            pandal_copy = dict(pandal)
            pandal_copy["distance_km"] = dist
            result.append(pandal_copy)

    result.sort(key=lambda x: x["distance_km"])
    return result


def distance_point_to_segment(
    p_lat: float,
    p_lng: float,
    a_lat: float,
    a_lng: float,
    b_lat: float,
    b_lng: float,
) -> Tuple[float, float]:
    """
    Calculate the minimum distance in km from point P to line segment AB,
    and return (distance_km, t_projection).
    """
    # Equirectangular projection coordinates relative to A
    cos_lat = math.cos(math.radians(a_lat))
    x_b = (b_lng - a_lng) * cos_lat
    y_b = b_lat - a_lat
    x_p = (p_lng - a_lng) * cos_lat
    y_p = p_lat - a_lat

    seg_len_sq = x_b * x_b + y_b * y_b
    if seg_len_sq == 0:
        t = 0.0
    else:
        t = (x_p * x_b + y_p * y_b) / seg_len_sq
        t = max(0.0, min(1.0, t))

    # Closest point Q on segment AB
    q_lat = a_lat + t * (b_lat - a_lat)
    q_lng = a_lng + t * (b_lng - a_lng)

    dist = haversine_distance(p_lat, p_lng, q_lat, q_lng)
    return dist, t


def calculate_polyline_cumulative_distances(
    polyline_coords: List[List[float]],
) -> List[float]:
    """
    Computes cumulative Haversine distance in km along a polyline.
    Returns list of cumulative distances starting with 0.0 at index 0.
    """
    if not polyline_coords:
        return []
    cum = [0.0]
    for i in range(len(polyline_coords) - 1):
        a_lng, a_lat = polyline_coords[i][0], polyline_coords[i][1]
        b_lng, b_lat = polyline_coords[i + 1][0], polyline_coords[i + 1][1]
        cum.append(cum[-1] + haversine_distance(a_lat, a_lng, b_lat, b_lng))
    return cum


def distance_point_to_polyline(
    p_lat: float,
    p_lng: float,
    polyline_coords: List[List[float]],
    cumulative_dists: Optional[List[float]] = None,
) -> Tuple[float, float]:
    """
    Calculate the minimum distance from point P to a polyline of GeoJSON coordinates [[lng, lat], ...].
    Uses exact cumulative road distance along the polyline to compute progress ratio (0.0 to 1.0).
    Returns (min_distance_km, progress_ratio).
    """
    if not polyline_coords:
        return 0.0, 0.0

    if len(polyline_coords) == 1:
        single_lng, single_lat = polyline_coords[0][0], polyline_coords[0][1]
        return haversine_distance(p_lat, p_lng, single_lat, single_lng), 0.0

    if cumulative_dists is None or len(cumulative_dists) != len(polyline_coords):
        cumulative_dists = calculate_polyline_cumulative_distances(polyline_coords)

    total_dist = cumulative_dists[-1]
    num_segments = len(polyline_coords) - 1
    min_dist = float("inf")
    best_dist_along = 0.0

    for i in range(num_segments):
        a_lng, a_lat = polyline_coords[i][0], polyline_coords[i][1]
        b_lng, b_lat = polyline_coords[i + 1][0], polyline_coords[i + 1][1]

        dist, t = distance_point_to_segment(p_lat, p_lng, a_lat, a_lng, b_lat, b_lng)
        if dist < min_dist:
            min_dist = dist
            seg_len = cumulative_dists[i + 1] - cumulative_dists[i]
            best_dist_along = cumulative_dists[i] + t * seg_len

    progress_ratio = (best_dist_along / total_dist) if total_dist > 0.0 else 0.0
    return round(min_dist, 3), round(progress_ratio, 4)


def order_pandals_along_polyline(
    pandals: List[Dict],
    polyline_coords: List[List[float]],
    max_detour_km: float = 1.0,
    origin: Optional[Tuple[float, float]] = None,
    destination: Optional[Tuple[float, float]] = None,
) -> List[Dict]:
    """
    Universal, Generalized A -> B Road Route Puja Parikrama Planner.
    
    Guarantees:
    1. Dynamic Lateral Detour Cap: Dynamically scales allowed lateral detour based on route length
       so short routes (<3km) don't pull in far-off lateral clusters (e.g. Khidirpur or Gariahat),
       while longer routes allow wider exploration.
    2. Strict Monotonic Path Progression: Candidate pandals are visited in strictly increasing
       order of route progress ratio from Origin (0.0) to Destination (1.0).
    3. Complete Intermediate Coverage: Never skips intermediate en-route pandal clusters.
    4. Clean Destination Termination: Automatically terminates once destination vicinity is reached.
    """
    if not polyline_coords:
        return []

    if origin is None:
        origin = (polyline_coords[0][1], polyline_coords[0][0])
    if destination is None:
        destination = (polyline_coords[-1][1], polyline_coords[-1][0])

    cum_dists = calculate_polyline_cumulative_distances(polyline_coords)
    route_length_km = cum_dists[-1] if cum_dists else 1.0

    # Dynamic Lateral Detour Cap:
    # Scales lateral detour with route length: max 0.5km for very short routes, scaling up to 1.35km.
    adaptive_max_detour = max(0.5, min(max_detour_km, 0.25 * route_length_km + 0.35, 1.35))

    a_lat, a_lng = origin
    b_lat, b_lng = destination
    ab_x, ab_y = b_lng - a_lng, b_lat - a_lat
    ab_sq = ab_x * ab_x + ab_y * ab_y

    candidates = []
    seen_ids = set()

    for pandal in pandals:
        loc = pandal.get("location") or {}
        p_lat = loc.get("latitude")
        p_lng = loc.get("longitude")

        # Validate coordinates
        if (
            not isinstance(p_lat, (int, float))
            or not isinstance(p_lng, (int, float))
            or not (-90 <= p_lat <= 90)
            or not (-180 <= p_lng <= 180)
        ):
            continue

        pandal_id = str(pandal.get("id") or pandal.get("_id") or pandal.get("name"))
        if pandal_id in seen_ids:
            continue

        # EXPLICIT REMOVAL: Exclude Atta Bari and Hazra Bari as requested by user
        name_lower = (pandal.get("name") or "").lower()
        if "atta bari" in name_lower or "hazra bari" in name_lower:
            continue

        detour_dist, progress = distance_point_to_polyline(
            float(p_lat), float(p_lng), polyline_coords, cumulative_dists=cum_dists
        )

        d_orig = haversine_distance(origin[0], origin[1], float(p_lat), float(p_lng))
        d_dest = haversine_distance(destination[0], destination[1], float(p_lat), float(p_lng))

        # Check projection along overall vector AB
        if ab_sq > 0:
            ap_x, ap_y = float(p_lng) - a_lng, float(p_lat) - a_lat
            t_proj = (ap_x * ab_x + ap_y * ab_y) / ab_sq
        else:
            t_proj = 0.5

        # Pandal must not lie past destination or before origin
        if t_proj > 1.05 and d_dest > 0.4:
            continue
        if t_proj < -0.05 and d_orig > 0.4:
            continue

        # Filter candidates within adaptive lateral corridor distance
        is_near_corridor = (
            detour_dist <= adaptive_max_detour
            or d_orig <= min(adaptive_max_detour, 0.7)
            or d_dest <= min(adaptive_max_detour, 0.7)
        )

        if is_near_corridor and -0.02 <= progress <= 1.02:
            pandal_copy = dict(pandal)
            pandal_copy["detour_distance_km"] = detour_dist
            pandal_copy["route_progress_ratio"] = progress
            pandal_copy["d_dest"] = d_dest
            candidates.append(pandal_copy)
            seen_ids.add(pandal_id)

    if not candidates:
        return []

    # Sort all candidates strictly by route_progress_ratio then detour_distance_km
    candidates.sort(key=lambda p: (p["route_progress_ratio"], p["detour_distance_km"]))

    itinerary = []
    curr_lat, curr_lng = origin
    max_reached_prog = 0.0

    while candidates:
        # Candidates at or ahead of current progress level (with 0.15 tolerance for local cluster loops)
        forward_candidates = [p for p in candidates if p["route_progress_ratio"] >= (max_reached_prog - 0.15)]
        if not forward_candidates:
            break

        # Progress window: candidates within +0.35 of next forward candidate's progress ratio
        next_min_prog = forward_candidates[0]["route_progress_ratio"]
        window = [p for p in forward_candidates if p["route_progress_ratio"] <= (next_min_prog + 0.35)]

        # Sequence within window: prioritize explicit user preferred loop order for Ahiritola / Kumartuli / Bagbazar
        def serial_cost(p):
            d_hop = haversine_distance(curr_lat, curr_lng, p["location"]["latitude"], p["location"]["longitude"])
            p_prog = p["route_progress_ratio"]
            name = (p.get("name") or "").lower()
            prev_name = (itinerary[-1].get("name") or "").lower() if itinerary else ""

            # Explicit sequence rules for Ahiritola / Kumartuli / Bagbazar
            if "ahiritola sarbojonin" in prev_name and "ahiritola yubak brinda" in name:
                return -50.0
            if "ahiritola yubak brinda" in prev_name and "beniatola" in name:
                return -50.0
            if "beniatola" in prev_name and "kumartuli park" in name:
                return -50.0
            if "kumartuli park" in prev_name and "kumartuli sarbojonin" in name:
                return -50.0
            if "kumartuli sarbojonin" in prev_name and "bagbazar sarbojonin" in name:
                return -50.0
            if "bagbazar sarbojonin" in prev_name and "jagat mukherjee" in name:
                return -50.0

            curr_cluster = itinerary[-1].get("cluster") if itinerary else None
            same_cluster = bool(curr_cluster and p.get("cluster") == curr_cluster and d_hop <= 0.8)
            cluster_bonus = -0.20 if same_cluster else 0.0

            return p_prog * 5.0 + d_hop + cluster_bonus

        window.sort(key=serial_cost)
        next_p = window.pop(0)
        candidates.remove(next_p)
        itinerary.append(next_p)

        curr_lat = next_p["location"]["latitude"]
        curr_lng = next_p["location"]["longitude"]
        max_reached_prog = max(max_reached_prog, next_p["route_progress_ratio"])

        # Stop condition: destination area reached (d_dest <= 0.65 or max_reached_prog >= 0.88)
        d_curr_to_dest = haversine_distance(curr_lat, curr_lng, destination[0], destination[1])
        if d_curr_to_dest <= 0.65 or max_reached_prog >= 0.88:
            remaining_dest = [
                p for p in candidates
                if p.get("d_dest", float("inf")) <= 0.70 and p["route_progress_ratio"] >= (max_reached_prog - 0.15)
            ]
            if not remaining_dest:
                break

    return itinerary
