"""
app/api/v1/router.py
--------------------
Central API router for Version 1 endpoints.
Aggregates sub-routers (health, pandals, users, etc.).
"""

from fastapi import APIRouter
from app.api.v1.endpoints import health, pandals, route, transit, trip, auth, user

api_router = APIRouter()

# Include sub-routers with prefixes and tags for OpenAPI docs
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Google OAuth"])
api_router.include_router(user.router, prefix="/user", tags=["User Account & Saved Trips"])
api_router.include_router(pandals.router, prefix="/pandals", tags=["Pandals"])
api_router.include_router(transit.router, prefix="/transit", tags=["Transit / Ride"])
api_router.include_router(trip.router, prefix="/trip", tags=["Puja Parikrama Trip Planner"])
api_router.include_router(route.router, prefix="/route", tags=["A to B Route Planner"])


