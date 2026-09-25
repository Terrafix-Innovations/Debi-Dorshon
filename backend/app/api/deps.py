"""
app/api/deps.py
---------------
Authentication and dependency injection helpers for route endpoints.
Provides get_current_user to enforce strict user-account isolation.
"""

from typing import Optional, Dict, Any
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_database
from app.core.security import decode_access_token

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Dict[str, Any]:
    """
    Enforces authentication on protected routes.
    Decodes the JWT token and fetches the current authenticated user from MongoDB.
    Raises 401 Unauthorized if token is missing, expired, or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user = await db[settings.USER_COLLECTION_NAME].find_one({"_id": ObjectId(user_id_str)})
    except Exception:
        user = await db[settings.USER_COLLECTION_NAME].find_one({"_id": user_id_str})
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or removed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Format string id
    user["id"] = str(user["_id"])
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> Optional[Dict[str, Any]]:
    """
    Optional authentication for endpoints that provide personalized data if logged in,
    or generic data if guest.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
