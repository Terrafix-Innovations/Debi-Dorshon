"""
backend/tests/test_transit.py
-----------------------------
Unit and integration tests for Ride by Train transit features,
verifying array-based station modeling (Approach 1), ingestion parsing,
MongoDB aggregations, and REST API endpoints.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.main import app
from app.schemas.pandal import PandalBase, PandalResponse, TransportInfoSchema
from app.schemas.transit import TrainStationResponse, StationPandalsResponse
from scripts.convert_excel import parse_stations, parse_ferry


def test_parse_stations_splitting():
    """Verify parsing and splitting of multi-station strings."""
    # Single station
    assert parse_stations("Howrah") == [{"name": "Howrah"}]

    # Slash delimiter
    res_slash = parse_stations("New Alipur / Majherhat")
    assert res_slash == [{"name": "New Alipur"}, {"name": "Majherhat"}]

    # Comma delimiter
    res_comma = parse_stations("Lake Gardens, Dhakuria")
    assert res_comma == [{"name": "Lake Gardens"}, {"name": "Dhakuria"}]

    # '&' and 'and' delimiters
    res_and = parse_stations("Sealdah & Bidhannagar Road and Dumdum")
    assert res_and == [
        {"name": "Sealdah"},
        {"name": "Bidhannagar Road"},
        {"name": "Dumdum"},
    ]

    # 'or' delimiter
    res_or = parse_stations("Ballygunge Jn or Dhakuria")
    assert res_or == [{"name": "Ballygunge Jn"}, {"name": "Dhakuria"}]

    # Empty, None, or 'nil' / 'none'
    assert parse_stations(None) == []
    assert parse_stations("") == []
    assert parse_stations("   ") == []
    assert parse_stations("nil") == []
    assert parse_stations("None") == []

    # Deduplication within same string
    assert parse_stations("Majherhat / Majherhat") == [{"name": "Majherhat"}]


def test_parse_ferry():
    """Verify single ferry station parsing."""
    assert parse_ferry("Bagbazar Ghat") == {"name": "Bagbazar Ghat"}
    assert parse_ferry(None) is None
    assert parse_ferry("nil") is None
    assert parse_ferry("") is None


def test_pandal_schema_validation_nearest_stations():
    """Verify PandalBase schema with nearest_stations list."""
    pandal = PandalBase(
        name="11 Pally",
        region="South",
        cluster="Behala",
        nearest_stations=[{"name": "New Alipur"}, {"name": "Majherhat"}],
    )
    assert len(pandal.nearest_stations) == 2
    assert pandal.nearest_stations[0].name == "New Alipur"
    assert pandal.nearest_stations[1].name == "Majherhat"

    # Default empty list when omitted
    pandal_no_transit = PandalBase(name="Solo Pandal")
    assert pandal_no_transit.nearest_stations == []

    # Response schema serialization
    response = PandalResponse(
        _id="65f1a2b3c4d5e6f7a8b9c0d1",
        name="11 Pally",
        nearest_stations=[{"name": "New Alipur"}, {"name": "Majherhat"}],
    )
    data = response.model_dump(by_alias=True)
    assert data["_id"] == "65f1a2b3c4d5e6f7a8b9c0d1"
    assert len(data["nearest_stations"]) == 2
    assert data["nearest_stations"][1]["name"] == "Majherhat"


def test_list_train_stations_api():
    """Integration test: GET /api/v1/transit/train/stations returns distinct unwound stations."""
    with TestClient(app) as client:
        response = client.get("/api/v1/transit/train/stations")
        assert response.status_code == 200
        stations = response.json()
        assert isinstance(stations, list)
        assert len(stations) > 0

        station_names = [s["name"] for s in stations]

        # Critical checks: Individual stations must exist independently
        assert "Majherhat" in station_names, "Majherhat must exist as a standalone station"
        assert "New Alipur" in station_names, "New Alipur must exist as a standalone station"
        assert "Lake Gardens" in station_names, "Lake Gardens must exist as a standalone station"
        assert "Dhakuria" in station_names, "Dhakuria must exist as a standalone station"

        # Critical checks: Phantom composite names must NOT exist
        assert "New Alipur / Majherhat" not in station_names
        assert "Lake Gardens / Dhakuria" not in station_names

        # Each station must have pandal_count > 0
        for s in stations:
            assert s["pandal_count"] > 0
            assert isinstance(s["name"], str)


def test_get_pandals_by_train_api():
    """Integration test: GET /api/v1/transit/train/pandals filters correctly by station name."""
    with TestClient(app) as client:
        # Test Majherhat
        response = client.get("/api/v1/transit/train/pandals?station_name=Majherhat")
        assert response.status_code == 200
        data = response.json()
        assert data["station_name"] == "Majherhat"
        assert data["total_pandals"] > 0
        assert len(data["pandals"]) == data["total_pandals"]

        # Verify every returned pandal has Majherhat in nearest_stations
        for pandal in data["pandals"]:
            station_names = [s["name"] for s in pandal.get("nearest_stations", [])]
            assert "Majherhat" in station_names

        # Test case insensitivity
        response_lower = client.get("/api/v1/transit/train/pandals?station_name=majherhat")
        assert response_lower.status_code == 200
        data_lower = response_lower.json()
        assert data_lower["total_pandals"] == data["total_pandals"]

        # Test New Alipur
        response_na = client.get("/api/v1/transit/train/pandals?station_name=New%20Alipur")
        assert response_na.status_code == 200
        data_na = response_na.json()
        assert data_na["total_pandals"] > 0
        for pandal in data_na["pandals"]:
            station_names = [s["name"] for s in pandal.get("nearest_stations", [])]
            assert "New Alipur" in station_names
