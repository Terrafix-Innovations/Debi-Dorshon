"""
app/schemas/transit.py
----------------------
Pydantic schemas for Ride by Metro and Ride by Train features.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.pandal import PandalResponse


class MetroStationResponse(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Shyambazar"})
    line: Optional[str] = Field(None, json_schema_extra={"example": "Blue Line"})
    pandal_count: int = Field(..., json_schema_extra={"example": 8})
    latitude: Optional[float] = Field(None, json_schema_extra={"example": 22.603889})
    longitude: Optional[float] = Field(None, json_schema_extra={"example": 88.371944})
    location: Optional[dict] = None


class TrainStationResponse(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Kolkata Station"})
    pandal_count: int = Field(..., json_schema_extra={"example": 12})


class StationPandalsResponse(BaseModel):
    station_name: str = Field(..., json_schema_extra={"example": "Shyambazar"})
    total_pandals: int = Field(..., json_schema_extra={"example": 8})
    pandals: List[PandalResponse]
