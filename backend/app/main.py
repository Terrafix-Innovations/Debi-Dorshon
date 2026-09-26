"""
app/main.py
-----------
Main entry point for Debi-Dorshon FastAPI Application.
Handles app lifecycle (MongoDB connection setup), CORS middleware, and API router registration.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.cache import cache
from app.core.http_client import init_http_client, close_http_client
from app.core.rate_limit import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown events (Lifespan Context)."""
    # Startup: Connect to MongoDB, Redis Cache, and HTTP Connection Pool
    await connect_to_mongo()
    await cache.init_cache()
    await init_http_client()
    yield
    # Shutdown: Close HTTP pool, Redis cache, and MongoDB connection
    await close_http_client()
    await cache.close_cache()
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Debi-Dorshon Durga Puja Guide App",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",       # Interactive Swagger UI docs at http://localhost:8000/docs
    redoc_url="/redoc",     # ReDoc documentation at http://localhost:8000/redoc
    lifespan=lifespan
)

# Register SlowAPI rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS (Cross-Origin Resource Sharing) middleware for Frontend / Mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://debi-dorshon.vercel.app",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https?://localhost(:[0-9]+)?|https?://127\.0\.0\.1(:[0-9]+)?|https?://192\.168\.\d+\.\d+(:[0-9]+)?|https?://10\.\d+\.\d+\.\d+(:[0-9]+)?|https?://172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    """Welcome root endpoint."""
    return {
        "message": "Welcome to Debi-Dorshon API!",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
