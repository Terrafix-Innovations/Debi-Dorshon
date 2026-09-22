"""
app/core/http_client.py
-----------------------
Singleton async HTTP client pool for outgoing requests (OSRM routing, Mapbox geocoding).
Eliminates TCP connection churn, reuses TLS connections, and prevents socket exhaustion.
"""

from typing import Optional
import httpx
import logging

logger = logging.getLogger("uvicorn")

_http_client: Optional[httpx.AsyncClient] = None


async def init_http_client():
    """Initializes the global pooled HTTP client on FastAPI app startup."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        limits = httpx.Limits(
            max_connections=100,
            max_keepalive_connections=20,
            keepalive_expiry=30.0,
        )
        timeout = httpx.Timeout(10.0, connect=5.0)
        _http_client = httpx.AsyncClient(limits=limits, timeout=timeout)
        logger.info("Global HTTP connection pool initialized.")


async def close_http_client():
    """Closes the global pooled HTTP client on FastAPI app shutdown."""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        logger.info("Closing global HTTP connection pool...")
        try:
            await _http_client.aclose()
        except Exception as e:
            logger.debug("HTTP client aclose notice during shutdown: %s", e)
        finally:
            _http_client = None
        logger.info("Global HTTP connection pool closed.")


def get_http_client() -> httpx.AsyncClient:
    """
    Returns the active pooled HTTP client.
    If called outside of the full FastAPI lifespan (e.g. standalone test scripts),
    lazily creates a fallback client.
    """
    global _http_client
    if _http_client is None or _http_client.is_closed:
        limits = httpx.Limits(
            max_connections=50,
            max_keepalive_connections=10,
            keepalive_expiry=30.0,
        )
        _http_client = httpx.AsyncClient(limits=limits, timeout=10.0)
    return _http_client
