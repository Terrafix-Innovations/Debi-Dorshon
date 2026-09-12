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
    Filters pandals within max_detour_km of the route polyline corridor,
    eliminates duplicates, and sequences them in a cluster-aware pandal-hopping tour:
    - Starts with the closest pandal to the start location within the route corridor.
    - Sweeps nearby pandals within local cluster / walking proximity (<= 0.65 km or same cluster).
    - Smoothly advances forward towards destination without erratic cross-city jumping or backtracking.
    """
    if not polyline_coords:
        return []

    if origin is None:
        origin = (polyline_coords[0][1], polyline_coords[0][0])
    if destination is None:
        destination = (polyline_coords[-1][1], polyline_coords[-1][0])

    cum_dists = calculate_polyline_cumulative_distances(polyline_coords)

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

        detour_dist, progress = distance_point_to_polyline(
            float(p_lat), float(p_lng), polyline_coords, cumulative_dists=cum_dists
        )

        d_orig = haversine_distance(origin[0], origin[1], float(p_lat), float(p_lng))
        if (detour_dist <= max_detour_km or d_orig <= 1.5) and -0.05 <= progress <= 1.15:
            pandal_copy = dict(pandal)
            pandal_copy["detour_distance_km"] = detour_dist
            pandal_copy["route_progress_ratio"] = progress
            candidates.append(pandal_copy)
            seen_ids.add(pandal_id)

    if not candidates:
        return []

    itinerary = []
    curr_lat, curr_lng = origin
    curr_prog = 0.0
    dest_lat, dest_lng = destination

    while candidates:
        if not itinerary:
            # 1. Starting step: pick candidate closest to origin (favoring destination orientation)
            candidates.sort(
                key=lambda p: haversine_distance(
                    curr_lat, curr_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
                + 0.2
                * haversine_distance(
                    dest_lat, dest_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
            )
            next_p = candidates.pop(0)
        else:
            # 2. Local walking proximity or cluster-aware inter-cluster advance:
            def hop_cost(p):
                d_hop = haversine_distance(
                    curr_lat, curr_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
                curr_cluster = itinerary[-1].get("cluster")
                same_cluster = bool(curr_cluster and p.get("cluster") == curr_cluster)
                cluster_bonus = -0.25 if same_cluster else 0.0
                d_dest = haversine_distance(
                    dest_lat, dest_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
                p_prog = p["route_progress_ratio"]
                backtrack = max(0.0, curr_prog - p_prog)
                if d_hop <= 0.8:
                    return d_hop + cluster_bonus
                return d_hop + 0.35 * d_dest + 8.0 * backtrack + cluster_bonus

            candidates.sort(key=hop_cost)
            next_p = candidates.pop(0)

        itinerary.append(next_p)
        curr_lat = next_p["location"]["latitude"]
        curr_lng = next_p["location"]["longitude"]
        curr_prog = max(curr_prog, next_p["route_progress_ratio"])

    return itinerary

