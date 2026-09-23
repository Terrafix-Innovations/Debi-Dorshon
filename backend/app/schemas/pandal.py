"""
app/schemas/pandal.py
---------------------
Pydantic validation models for Durga Puja Pandals matching debi_dorshon.json structure.
Similar to DTOs (Data Transfer Objects) or Mongoose Schemas in Node.js.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class LocationSchema(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class TransportInfoSchema(BaseModel):
    name: Optional[str] = None
    line: Optional[str] = None
    distance: Optional[str] = None


class PandalBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Shikdar Bagan"})
    region: Optional[str] = Field(None, json_schema_extra={"example": "North"})
    cluster: Optional[str] = Field(None, json_schema_extra={"example": "Shyambazar"})
    location: Optional[LocationSchema] = None
    nearest_metro: Optional[TransportInfoSchema] = None
    nearest_stations: Optional[List[TransportInfoSchema]] = Field(
        default_factory=list,
        json_schema_extra={"example": [{"name": "New Alipur"}, {"name": "Majherhat"}]}
    )
    nearest_station: Optional[TransportInfoSchema] = None
    nearest_ferry: Optional[TransportInfoSchema] = None


class PandalResponse(PandalBase):
    """Schema returned in API responses. Includes MongoDB string ID."""
    id: str = Field(..., alias="_id", json_schema_extra={"example": "64d3f1a2b3c4d5e6f7a8b9c0"})

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

