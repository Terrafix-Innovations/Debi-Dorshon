"""
app/core/config.py
------------------
Application settings powered by Pydantic BaseSettings.
Loads environment variables from `.env` automatically.
Your FastAPI dev friend can easily add JWT keys, CORS origins, Redis URLs here later!
"""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILES = [
    _BACKEND_DIR / ".env",
    _BACKEND_DIR.parent / ".env",
    Path(".env"),
]


class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Debi-Dorshon API"
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "debi_dorshon_db"
    PANDAL_COLLECTION_NAME: str = "pandals"

    # Routing Engine Settings (OSRM)
    OSRM_BASE_URL: str = "http://router.project-osrm.org"
    OSRM_TIMEOUT_SECONDS: float = 10.0

    # Optional Mapbox Access Token (kept securely on backend)
    MAPBOX_ACCESS_TOKEN: Optional[str] = None

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_ANDROID_CLIENT_ID: Optional[str] = None
    GOOGLE_IOS_CLIENT_ID: Optional[str] = None

    # JWT Authentication & User Sandboxing (Permanent non-expiring sessions)
    JWT_SECRET_KEY: str = "default_insecure_key_override_in_env"
    JWT_ALGORITHM: str = "HS256"
    USER_COLLECTION_NAME: str = "users"
    TRIP_COLLECTION_NAME: str = "user_trips"
    FAVORITE_COLLECTION_NAME: str = "user_favorites"

    # Redis & Caching Settings
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    CACHE_TTL_TRANSIT: int = 3600        # 1 hour for station lists
    CACHE_TTL_STATION_PANDALS: int = 1800 # 30 mins for pandals at station
    CACHE_TTL_AUTOCOMPLETE: int = 900    # 15 mins for search suggestions
    CACHE_TTL_ROUTE_PLAN: int = 1800      # 30 mins for identical route requests

    # Rate Limiting Settings
    RATE_LIMIT_ROUTE_PLAN: str = "7/minute"
    RATE_LIMIT_AUTOCOMPLETE: str = "60/minute"
    RATE_LIMIT_DEFAULT: str = "120/minute"

    # Concurrency / Multi-worker Setting (Render / Docker)
    WEB_CONCURRENCY: int = 2

    # Configure Pydantic to read from `.env` file
    model_config = SettingsConfigDict(
        env_file=[str(p) for p in _ENV_FILES if p.exists()] or [".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Instantiate single global settings object
settings = Settings()
