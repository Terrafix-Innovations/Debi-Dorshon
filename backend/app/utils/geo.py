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

    # Vector AB for origin to destination bounds checking
    a_lat, a_lng = origin
    b_lat, b_lng = destination
    ab_x, ab_y = b_lng - a_lng, b_lat - a_lat
    ab_sq = ab_x * ab_x + ab_y * ab_y

    effective_max_detour = min(max_detour_km, 1.25)

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
        d_dest = haversine_distance(destination[0], destination[1], float(p_lat), float(p_lng))

        # Check projection along overall vector AB
        if ab_sq > 0:
            ap_x, ap_y = float(p_lng) - a_lng, float(p_lat) - a_lat
            t_proj = (ap_x * ab_x + ap_y * ab_y) / ab_sq
        else:
            t_proj = 0.5

        # Pandal must not lie significantly past destination in direction of travel
        if t_proj > 1.05 and d_dest > 0.4:
            continue

        # Pandal must not lie significantly before origin in direction of travel
        if t_proj < -0.05 and d_orig > 0.4:
            continue

        # Pandal must be within effective_max_detour of the route corridor or immediate trip endpoints
        is_near_corridor = (
            detour_dist <= effective_max_detour
            or d_orig <= 0.8
            or d_dest <= 0.8
        )
        if is_near_corridor and -0.05 <= progress <= 1.05:
            pandal_copy = dict(pandal)
            pandal_copy["detour_distance_km"] = detour_dist
            pandal_copy["route_progress_ratio"] = progress
            pandal_copy["d_dest"] = d_dest
            candidates.append(pandal_copy)
            seen_ids.add(pandal_id)

    if not candidates:
        return []

    itinerary = []
    curr_lat, curr_lng = origin
    max_reached_prog = 0.0
    dest_reached = False

    while candidates:
        if not itinerary:
            candidates.sort(
                key=lambda p: haversine_distance(
                    curr_lat, curr_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
                + 2.0 * p["route_progress_ratio"]
            )
            next_p = candidates.pop(0)
            itinerary.append(next_p)
            curr_lat = next_p["location"]["latitude"]
            curr_lng = next_p["location"]["longitude"]
            max_reached_prog = max(max_reached_prog, next_p["route_progress_ratio"])
            if next_p.get("d_dest", float("inf")) <= 0.65 or next_p["route_progress_ratio"] >= 0.85:
                dest_reached = True
        else:
            d_curr_to_dest = haversine_distance(curr_lat, curr_lng, destination[0], destination[1])
            if d_curr_to_dest <= 0.65 or itinerary[-1].get("d_dest", float("inf")) <= 0.65 or max_reached_prog >= 0.85:
                dest_reached = True

            valid_candidates = []
            for p in candidates:
                p_prog = p["route_progress_ratio"]
                d_hop = haversine_distance(
                    curr_lat, curr_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
                curr_cluster = itinerary[-1].get("cluster")
                same_cluster = bool(curr_cluster and p.get("cluster") == curr_cluster and d_hop <= 1.2)

                if dest_reached:
                    # Once destination area is reached, only accept candidates in destination cluster or immediate walking vicinity
                    if p.get("d_dest", float("inf")) <= 0.75 or (same_cluster and d_hop <= 0.8):
                        valid_candidates.append(p)
                else:
                    if p_prog >= (max_reached_prog - 0.10) or (same_cluster and d_hop <= 1.0):
                        valid_candidates.append(p)

            if not valid_candidates:
                if dest_reached:
                    # Destination area fully swept, stop tour! Do not jump to Khidirpur or far off regions.
                    break
                candidates = [p for p in candidates if p["route_progress_ratio"] >= (max_reached_prog - 0.05)]
                if not candidates:
                    break
                valid_candidates = candidates

            def hop_cost(p):
                d_hop = haversine_distance(
                    curr_lat, curr_lng, p["location"]["latitude"], p["location"]["longitude"]
                )
                curr_cluster = itinerary[-1].get("cluster")
                same_cluster = bool(curr_cluster and p.get("cluster") == curr_cluster and d_hop <= 1.2)
                cluster_bonus = -0.35 if same_cluster else 0.0

                p_prog = p["route_progress_ratio"]
                prog_diff = p_prog - max_reached_prog
                prog_penalty = 2.0 * max(0.0, prog_diff)
                backtrack_penalty = 4.0 * abs(min(0.0, prog_diff))

                return d_hop + prog_penalty + backtrack_penalty + cluster_bonus

            valid_candidates.sort(key=hop_cost)
            next_p = valid_candidates.pop(0)
            candidates.remove(next_p)
            itinerary.append(next_p)
            curr_lat = next_p["location"]["latitude"]
            curr_lng = next_p["location"]["longitude"]
            max_reached_prog = max(max_reached_prog, next_p["route_progress_ratio"])
            if next_p.get("d_dest", float("inf")) <= 0.65 or next_p["route_progress_ratio"] >= 0.85:
                dest_reached = True

    return itinerary
