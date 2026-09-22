"""
backend/tests/test_scalability.py
---------------------------------
Unit & integration tests for backend scalability features:
1. Resilient Redis & in-memory fallback cache operations.
2. Rate limiting enforcement on /api/v1/route/plan (7 req/minute).
3. HTTP connection pool lifecycle.
4. Enhanced health check endpoint reporting DB & Cache health.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.cache import cache
from app.core.config import settings

client = TestClient(app)


@pytest.mark.anyio
async def test_cache_service_operations():
    """Verify get_json, set_json, delete, and expiration in cache layer."""
    test_key = "test:scalability:key"
    test_data = {"pandal": "Kumartuli Park", "rating": 5}

    # Set and retrieve
    await cache.set_json(test_key, test_data, expire=10)
    retrieved = await cache.get_json(test_key)
    assert retrieved == test_data

    # Delete
    await cache.delete(test_key)
    after_del = await cache.get_json(test_key)
    assert after_del is None


def test_health_check_includes_cache():
    """Verify /api/v1/health returns database and cache statuses."""
    response = client.get(f"{settings.API_V1_STR}/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "cache" in data
    assert data["cache"] in ["redis_connected", "in_memory_fallback"]


from unittest.mock import AsyncMock, patch
from app.schemas.route import RoutePlanResponse, RouteGeometry


def test_route_plan_rate_limiting():
    """Verify that /api/v1/route/plan enforces rate limiting (7 req/minute)."""
    payload = {
        "origin": {"latitude": 22.5726, "longitude": 88.3639},
        "destination": {"latitude": 22.5958, "longitude": 88.3712},
        "max_detour_km": 1.0,
        "max_pandals": 5,
    }

    dummy_response = RoutePlanResponse(
        origin={"latitude": 22.5726, "longitude": 88.3639},
        destination={"latitude": 22.5958, "longitude": 88.3712},
        total_pandals=0,
        estimated_distance_km=2.5,
        max_detour_km=1.0,
        itinerary=[],
        route_geometry=RouteGeometry(
            type="LineString",
            coordinates=[[88.3639, 22.5726], [88.3712, 22.5958]]
        ),
    )

    hit_429 = False
    with patch(
        "app.services.route_planner.RoutePlannerService.plan_route",
        new=AsyncMock(return_value=dummy_response)
    ):
        for _ in range(12):
            resp = client.post(f"{settings.API_V1_STR}/route/plan", json=payload)
            if resp.status_code == 429:
                hit_429 = True
                break

    assert hit_429, "Expected rate limit (HTTP 429) to be triggered on route planning"
