"""
app/schemas/auth.py
-------------------
Pydantic schemas for Google OAuth authentication, User Profile, and Account Isolation.
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = Field(None, description="Google OAuth ID Token obtained from Google Sign-In")
    access_token: Optional[str] = Field(None, description="Google OAuth Access Token obtained from Google Sign-In")


class EmailRegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)")
    name: Optional[str] = Field(None, description="User full name")


class EmailLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserProfile(BaseModel):
    id: str = Field(..., description="MongoDB string ID of the user")
    email: str = Field(..., description="User email address")
    name: str = Field(..., description="User full name")
    picture: Optional[str] = Field(None, description="Google profile avatar URL")
    completed_trips: int = Field(0, description="Count of completed trips")
    redeem_points: int = Field(0, description="Earned reward / redeem points")
    favorite_pandals: List[str] = Field(default_factory=list, description="List of favorite pandal IDs")
    created_at: Optional[str] = Field(None, description="Account creation timestamp")


class AuthResponse(BaseModel):
    access_token: str = Field(..., description="JWT Bearer token")
    token_type: str = Field("bearer", description="Token type")
    user: UserProfile


class UserTripSaveRequest(BaseModel):
    title: Optional[str] = Field(None, description="Custom trip title")
    origin_name: Optional[str] = Field(None, description="Starting point name")
    destination_name: Optional[str] = Field(None, description="Destination name")
    origin: Dict[str, Any] = Field(..., description="Origin location coords {latitude, longitude}")
    destination: Dict[str, Any] = Field(..., description="Destination location coords {latitude, longitude}")
    pandal_ids: List[str] = Field(default_factory=list, description="IDs of visited or planned pandals")
    distance_km: float = Field(0.0, description="Estimated total travel distance")
    estimated_duration_mins: Optional[int] = Field(None, description="Estimated trip duration in minutes")
    status: str = Field("saved", description="Trip status: saved, completed, active")


class UserTripResponse(BaseModel):
    id: str = Field(..., description="Trip ID")
    user_id: str = Field(..., description="Owner User ID")
    title: str
    origin_name: Optional[str]
    destination_name: Optional[str]
    origin: Dict[str, Any]
    destination: Dict[str, Any]
    pandal_ids: List[str]
    pandals: Optional[List[Dict[str, Any]]] = None
    distance_km: float
    estimated_duration_mins: Optional[int]
    status: str
    created_at: str


class FavoriteToggleRequest(BaseModel):
    pandal_id: str = Field(..., description="Pandal ID to add/remove from user favorites")


class FavoriteResponse(BaseModel):
    pandal_id: str
    is_favorite: bool
    favorite_pandals: List[str]
