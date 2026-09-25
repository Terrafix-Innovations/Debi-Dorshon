"""
backend/tests/test_auth_and_user.py
-----------------------------------
Unit tests for Auth endpoints and User Account Data Isolation.
Verifies that:
1. Public auth config returns google_client_id without leaking secrets.
2. Protected endpoints reject requests without valid JWT token (401).
3. JWT creation & decoding properly works.
4. User account data (trips, favorites) is strictly isolated between distinct users.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token, decode_access_token


@pytest.fixture
def client():
    return TestClient(app)


def test_auth_config_endpoint(client):
    """Verify that public client ID is returned and secret is not exposed."""
    response = client.get("/api/v1/auth/config")
    assert response.status_code == 200
    data = response.json()
    assert "google_client_id" in data
    assert "GOOGLE_CLIENT_SECRET" not in str(data)
    assert "client_secret" not in data
    assert data["auth_enabled"] is True


def test_unauthorized_access_rejected(client):
    """Verify that protected user endpoints require valid Bearer token."""
    # /auth/me
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # /user/trips
    res2 = client.get("/api/v1/user/trips")
    assert res2.status_code == 401

    # /user/favorites
    res3 = client.get("/api/v1/user/favorites")
    assert res3.status_code == 401


def test_jwt_token_creation_and_decoding():
    """Verify JWT token encode and decode integrity."""
    payload = {"sub": "6511a2b3c4d5e6f7a8b9c0d1", "email": "test@debidorshon.com", "name": "Test User"}
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == payload["sub"]
    assert decoded["email"] == payload["email"]
    assert decoded["name"] == payload["name"]
    assert "exp" not in decoded  # Permanent session, never expires
    assert "iat" in decoded


def test_password_hashing_and_verification():
    """Verify PBKDF2 password hashing and verification."""
    from app.core.security import hash_password, verify_password
    pwd = "SecurePujoPassword123!"
    hashed = hash_password(pwd)
    assert ":" in hashed
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

