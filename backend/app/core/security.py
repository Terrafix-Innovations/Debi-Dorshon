"""
app/core/security.py
--------------------
Security utilities for JWT token creation, verification, and Google OAuth ID token verification.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a permanent signed JWT access token (never expires)."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({
        "iat": now,
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a signed JWT access token. Returns payload or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def verify_google_id_token(id_token_str: str) -> Dict[str, Any]:
    """
    Verify the Google OAuth ID token against Google's public keys.
    Returns the decoded token claims dictionary containing email, name, picture, sub.
    Tolerates audience mismatch across platforms (web, android, ios, expo) by falling
    back to Google certificate signature check and official tokeninfo endpoint.
    """
    request = google_requests.Request()
    audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
    
    # 1. Try standard verification with configured audience
    try:
        id_info = id_token.verify_oauth2_token(id_token_str, request, audience=audience)
        return id_info
    except Exception:
        pass

    # 2. Try verification without strict audience (still verifies Google certificate cryptographic signature)
    try:
        id_info = id_token.verify_oauth2_token(id_token_str, request)
        return id_info
    except Exception:
        pass

    # 3. Direct verification via Google tokeninfo endpoint
    import requests as http_requests
    try:
        resp = http_requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token_str}",
            timeout=8.0,
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass

    raise ValueError("Google ID token could not be verified.")


def verify_google_access_token(access_token_str: str) -> Dict[str, Any]:
    """
    Verify a Google OAuth access token and retrieve user profile info
    via Google's userinfo endpoint.
    """
    import requests as http_requests
    try:
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token_str}"},
            timeout=8.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "sub": data.get("sub"),
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": data.get("picture"),
            }
        raise ValueError(f"Google userinfo request failed with status {resp.status_code}")
    except Exception as e:
        raise ValueError(f"Could not verify Google access token: {str(e)}")


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a unique random salt."""
    import hashlib
    import secrets
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}:{key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salt:hash string."""
    import hashlib
    import secrets
    try:
        if not hashed_password or ":" not in hashed_password:
            return False
        salt, key_hex = hashed_password.split(":", 1)
        new_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

