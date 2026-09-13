"""
app/schemas/route.py
--------------------
Pydantic validation models for the A -> B Road Route-Based Puja Pandal Planner.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.pandal import PandalResponse


class PointSchema(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, json_schema_extra={"example": 22.5726})
    longitude: float = Field(..., ge=-180.0, le=180.0, json_schema_extra={"example": 88.3639})


class RoutePlanRequest(BaseModel):
    origin: PointSchema
    destination: PointSchema
    max_detour_km: float = Field(1.0, ge=0.1, le=20.0, description="Maximum off-route distance in km", json_schema_extra={"example": 1.0})
    max_pandals: Optional[int] = Field(None, ge=1, le=500, description="Optional maximum number of pandals to return", json_schema_extra={"example": 15})
    region: Optional[str] = Field(None, json_schema_extra={"example": "North"})
    cluster: Optional[str] = Field(None, json_schema_extra={"example": "Shyambazar"})



class RouteItineraryItem(BaseModel):
    step: int = Field(..., json_schema_extra={"example": 1})
    pandal: PandalResponse
    detour_distance_km: float = Field(..., json_schema_extra={"example": 0.35}, description="Distance from the road route in km")
    route_progress_ratio: float = Field(..., json_schema_extra={"example": 0.25}, description="Relative progress along A -> B route (0.0 to 1.0)")


class RouteGeometry(BaseModel):
    type: str = Field("LineString", json_schema_extra={"example": "LineString"})
    coordinates: List[List[float]] = Field(..., description="GeoJSON polyline coordinates [[lng, lat], ...]")


class RoutePlanResponse(BaseModel):
    origin: PointSchema
    destination: PointSchema
    total_pandals: int = Field(..., json_schema_extra={"example": 5})
    estimated_distance_km: float = Field(..., json_schema_extra={"example": 8.4})
    max_detour_km: float = Field(..., json_schema_extra={"example": 1.0})
    itinerary: List[RouteItineraryItem]
    route_geometry: RouteGeometry
