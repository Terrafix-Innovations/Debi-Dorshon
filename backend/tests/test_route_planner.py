"""
backend/tests/test_route_planner.py
------------------------------------
Unit and integration tests for the A -> B Road Route-Based Puja Pandal Planner.
Includes schema validation, polyline geo-distance calculations, route ordering,
and mock OSRM routing service error handling.
"""

import pytest
from unittest.mock import AsyncMock, patch
from pydantic import ValidationError
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.route import PointSchema, RoutePlanRequest
from app.utils.geo import (
    distance_point_to_segment,
    distance_point_to_polyline,
    order_pandals_along_polyline,
)
from app.services.route_planner import OSRMClient, RoutePlannerService


client = TestClient(app)


def test_request_schema_validation():
    """1 & 3. Validate request schema and coordinate ranges."""
    # Valid origin and destination
    req = RoutePlanRequest(
        origin={"latitude": 22.5726, "longitude": 88.3639},
        destination={"latitude": 22.5958, "longitude": 88.3712},
        max_detour_km=1.0,
        max_pandals=10,
    )
    assert req.origin.latitude == 22.5726
    assert req.max_detour_km == 1.0

    # Invalid latitude (> 90)
    with pytest.raises(ValidationError):
        PointSchema(latitude=95.0, longitude=88.3639)

    # Invalid longitude (< -180)
    with pytest.raises(ValidationError):
        PointSchema(latitude=22.5726, longitude=-190.0)


def test_endpoint_registration():
    """2. Verify POST /api/v1/route/plan is registered in OpenAPI schema."""
    openapi_spec = app.openapi()
    assert "/api/v1/route/plan" in openapi_spec["paths"]
    assert "post" in openapi_spec["paths"]["/api/v1/route/plan"]


def test_geo_distance_point_to_segment():
    """4. Test point-to-segment distance calculation."""
    # Segment along latitude 22.6000 from lon 88.3500 to 88.3700
    a_lat, a_lng = 22.6000, 88.3500
    b_lat, b_lng = 22.6000, 88.3700

    # Point P directly above segment midpoint at (22.6050, 88.3600) (~0.55 km away)
    p_lat, p_lng = 22.6050, 88.3600
    dist, t = distance_point_to_segment(p_lat, p_lng, a_lat, a_lng, b_lat, b_lng)
    assert 0.4 <= dist <= 0.7
    assert 0.4 <= t <= 0.6


def test_pandal_filtering_and_ordering():
    """5 & 6. Test filtering within 1.0 km detour limit and ordering along polyline."""
    polyline_coords = [
        [88.3500, 22.6000],  # Point A
        [88.3600, 22.6000],  # Midpoint
        [88.3700, 22.6000],  # Point B
    ]

    pandals = [
        # Near Point B (progress ~ 0.9)
        {
            "id": "pandal_b",
            "name": "Pandal Near B",
            "location": {"latitude": 22.6010, "longitude": 88.3690},
        },
        # Near Point A (progress ~ 0.1)
        {
            "id": "pandal_a",
            "name": "Pandal Near A",
            "location": {"latitude": 22.6010, "longitude": 88.3510},
        },
        # Far away (> 5 km)
        {
            "id": "pandal_far",
            "name": "Pandal Far Away",
            "location": {"latitude": 22.5000, "longitude": 88.3000},
        },
        # Duplicate of pandal_a
        {
            "id": "pandal_a",
            "name": "Pandal Near A Duplicate",
            "location": {"latitude": 22.6010, "longitude": 88.3510},
        },
    ]

    ordered = order_pandals_along_polyline(pandals, polyline_coords, max_detour_km=1.0)

    # Far away pandal and duplicate pandal should be excluded
    assert len(ordered) == 2
    # First pandal should be Pandal Near A (ordered along path from A to B)
    assert ordered[0]["id"] == "pandal_a"
    assert ordered[1]["id"] == "pandal_b"
    assert ordered[0]["detour_distance_km"] <= 1.0
    assert ordered[1]["detour_distance_km"] <= 1.0


def test_empty_candidate_result():
    """7. Gracefully handle an empty candidate set when no pandals are within detour distance."""
    polyline_coords = [[88.3500, 22.6000], [88.3700, 22.6000]]
    pandals = [
        {
            "id": "pandal_far",
            "name": "Far Pandal",
            "location": {"latitude": 22.1000, "longitude": 88.1000},
        }
    ]

    ordered = order_pandals_along_polyline(pandals, polyline_coords, max_detour_km=1.0)
    assert len(ordered) == 0


@pytest.mark.anyio
async def test_routing_failure_handling():
    """8. Handle routing service failure / timeout gracefully with HTTP 502 Bad Gateway."""
    from fastapi import HTTPException
    import httpx

    osrm_client = OSRMClient(base_url="http://invalid-osrm-server.example.com", timeout=0.1)

    origin = PointSchema(latitude=22.5726, longitude=88.3639)
    destination = PointSchema(latitude=22.5958, longitude=88.3712)

    with patch("httpx.AsyncClient.get", side_effect=httpx.RequestError("Connection refused")):
        with pytest.raises(HTTPException) as exc_info:
            await osrm_client.get_route(origin, destination)
        assert exc_info.value.status_code == 502


def test_cluster_aware_pandal_hopping_tour():
    """9. Verify cluster-aware tour starts at nearest pandal to origin and progresses smoothly towards destination."""
    origin = (22.5675, 88.3711)  # Sealdah Station
    destination = (22.5958, 88.3585)  # Ahiritola

    # Polyline from Sealdah towards Ahiritola
    polyline_coords = [
        [88.3711, 22.5675],
        [88.3680, 22.5750],
        [88.3620, 22.5850],
        [88.3585, 22.5958],
    ]

    pandals = [
        {
            "id": "ahiritola_pandal",
            "name": "Ahiritola Sarbojonin",
            "cluster": "Ahiritola-Kumartuli-Bagbazar",
            "location": {"latitude": 22.5958, "longitude": 88.3585},
        },
        {
            "id": "shyambazar_pandal",
            "name": "Kashi Bose Lane",
            "cluster": "Shyambazar",
            "location": {"latitude": 22.5908, "longitude": 88.3689},
        },
        {
            "id": "sealdah_pandal",
            "name": "Sealdah Athletic Club",
            "cluster": "Central Kolkata",
            "location": {"latitude": 22.5683, "longitude": 88.3717},
        },
        {
            "id": "bowbazar_pandal",
            "name": "Santosh Mitra Square",
            "cluster": "Central Kolkata",
            "location": {"latitude": 22.5668, "longitude": 88.3664},
        },
    ]

    ordered = order_pandals_along_polyline(
        pandals,
        polyline_coords,
        max_detour_km=1.0,
        origin=origin,
        destination=destination,
    )

    assert len(ordered) == 4
    # Pandal 1 must be Sealdah Athletic Club (closest to Sealdah Station origin)
    assert ordered[0]["id"] == "sealdah_pandal"
    # Pandal 2 must be Santosh Mitra Square (sweeps Central Kolkata cluster)
    assert ordered[1]["id"] == "bowbazar_pandal"
    # Pandal 3 must be Kashi Bose Lane (advances to Shyambazar cluster)
    assert ordered[2]["id"] == "shyambazar_pandal"
    # Final pandal must be Ahiritola Sarbojonin (reaches destination)
    assert ordered[3]["id"] == "ahiritola_pandal"


def test_destination_arrival_and_no_backtrack_loop():
    """10. Verify that arriving at destination does not trigger backtracking or far-off candidate loops."""
    # Route from 75 Palli to Maddox Square
    origin = (22.5333, 88.3457)
    destination = (22.5265, 88.3546)

    # Simplified polyline corridor
    polyline_coords = [
        [88.3457, 22.5333],
        [88.3489, 22.5278],
        [88.3546, 22.5265],
    ]

    pandals = [
        {
            "id": "75_palli",
            "name": "75 Pally",
            "cluster": "Bhowanipur",
            "location": {"latitude": 22.5333, "longitude": 88.3457},
        },
        {
            "id": "abasar",
            "name": "Bhawanipur Abasar",
            "cluster": "Bhowanipur",
            "location": {"latitude": 22.5278, "longitude": 88.3489},
        },
        {
            "id": "maddox_square",
            "name": "Maddox Square",
            "cluster": "Bhowanipur",
            "location": {"latitude": 22.5265, "longitude": 88.3546},
        },
        # Pandal far away or past destination that should not be appended after reaching Maddox Square
        {
            "id": "chakraberia",
            "name": "Chakraberia Sarbojonin",
            "cluster": "Bhowanipur",
            "location": {"latitude": 22.5336, "longitude": 88.3519},
        },
    ]

    ordered = order_pandals_along_polyline(
        pandals,
        polyline_coords,
        max_detour_km=0.8,
        origin=origin,
        destination=destination,
    )

    ids = [p["id"] for p in ordered]
    assert ids[0] == "75_palli"
    assert "maddox_square" in ids
    # The last pandal must be Maddox Square (destination reached, no post-destination loop)
    assert ids[-1] == "maddox_square"
    assert "chakraberia" not in ids[ids.index("maddox_square") + 1 :]

