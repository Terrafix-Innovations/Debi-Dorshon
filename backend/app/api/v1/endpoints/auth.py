"""
app/api/v1/endpoints/auth.py
-----------------------------
Authentication API endpoints:
- GET /api/v1/auth/config: Delivers public Google Client ID dynamically to frontends.
- POST /api/v1/auth/google: Verifies Google ID token and issues signed JWT session.
- GET /api/v1/auth/me: Returns authenticated user's profile and live stats.
"""

from datetime import datetime, timezone
import logging
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_database
from app.core.security import (
    verify_google_id_token,
    verify_google_access_token,
    create_access_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import (
    GoogleAuthRequest,
    EmailRegisterRequest,
    EmailLoginRequest,
    AuthResponse,
    UserProfile,
)
from app.api.deps import get_current_user

logger = logging.getLogger("uvicorn")
router = APIRouter()


@router.post("/register", response_model=AuthResponse, summary="Register with Email & Password")
async def register_with_email(
    payload: EmailRegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Registers a new user account with email and password.
    Issues permanent JWT access token and 50 welcome reward points.
    """
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required.",
        )

    user_collection = db[settings.USER_COLLECTION_NAME]
    existing_user = await user_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in.",
        )

    name = payload.name.strip() if payload.name else email.split("@")[0]
    hashed_pwd = hash_password(payload.password)
    now_iso = datetime.now(timezone.utc).isoformat()

    new_user_doc = {
        "email": email,
        "password_hash": hashed_pwd,
        "name": name,
        "picture": None,
        "completed_trips": 0,
        "redeem_points": 50,  # 50 welcome points
        "favorite_pandals": [],
        "created_at": now_iso,
        "last_login": now_iso,
    }
    result = await user_collection.insert_one(new_user_doc)
    user_id = str(result.inserted_id)

    access_token = create_access_token({"sub": user_id, "email": email, "name": name})

    profile = UserProfile(
        id=user_id,
        email=email,
        name=name,
        picture=None,
        completed_trips=0,
        redeem_points=50,
        favorite_pandals=[],
        created_at=now_iso,
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=profile,
    )


@router.post("/login", response_model=AuthResponse, summary="Sign in with Email & Password")
async def login_with_email(
    payload: EmailLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Authenticates an existing user with email and password.
    Returns permanent JWT access token and profile.
    """
    email = payload.email.strip().lower()
    user_collection = db[settings.USER_COLLECTION_NAME]
    user = await user_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    password_hash = user.get("password_hash")
    if not password_hash or not verify_password(payload.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(user["_id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    await user_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": now_iso}},
    )

    access_token = create_access_token({
        "sub": user_id,
        "email": user.get("email"),
        "name": user.get("name"),
    })

    # Count actual trips and favorites
    trip_count = await db[settings.TRIP_COLLECTION_NAME].count_documents({"user_id": user_id})
    fav_docs = await db[settings.FAVORITE_COLLECTION_NAME].find({"user_id": user_id}).to_list(1000)
    favorite_pandals = [doc["pandal_id"] for doc in fav_docs if "pandal_id" in doc]

    profile = UserProfile(
        id=user_id,
        email=user.get("email", ""),
        name=user.get("name", ""),
        picture=user.get("picture"),
        completed_trips=max(trip_count, user.get("completed_trips", 0)),
        redeem_points=user.get("redeem_points", 0),
        favorite_pandals=favorite_pandals,
        created_at=user.get("created_at"),
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=profile,
    )



@router.get("/config", summary="Get Public Auth Configuration")
async def get_auth_config():
    """
    Returns public OAuth configuration so frontend apps can initialize
    Google Sign-In dynamically without exposing keys in frontend environment files.
    """
    return {
        "google_client_id": settings.GOOGLE_CLIENT_ID or "",
        "google_android_client_id": settings.GOOGLE_ANDROID_CLIENT_ID or "",
        "google_ios_client_id": settings.GOOGLE_IOS_CLIENT_ID or "",
        "auth_enabled": bool(settings.GOOGLE_CLIENT_ID),
    }


@router.post("/google", response_model=AuthResponse, summary="Sign in with Google OAuth")
async def sign_in_with_google(
    payload: GoogleAuthRequest,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Authenticates a user via Google OAuth ID token or access token.
    1. Cryptographically verifies the Google ID token or validates the Google access token.
    2. Finds or creates the user record in the MongoDB 'users' collection.
    3. Issues a signed JWT access token for sandboxed account isolation.
    """
    id_info = None
    if payload.id_token:
        try:
            id_info = verify_google_id_token(payload.id_token)
        except Exception as e:
            logger.warning("Google ID token verification failed: %s", str(e))

    if not id_info and payload.access_token:
        try:
            id_info = verify_google_access_token(payload.access_token)
        except Exception as e:
            logger.warning("Google access token verification failed: %s", str(e))

    if not id_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed. Please provide a valid Google token.",
        )

    google_id = id_info.get("sub")
    email = id_info.get("email")
    name = id_info.get("name") or (email.split("@")[0] if email else "Puja Pilgrim")
    picture = id_info.get("picture")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must have an associated email address.",
        )

    user_collection = db[settings.USER_COLLECTION_NAME]

    # Find existing user by google_id or email
    user = await user_collection.find_one({"$or": [{"google_id": google_id}, {"email": email}]})
    now_iso = datetime.now(timezone.utc).isoformat()

    if not user:
        # Create new user record with welcome reward points
        new_user_doc = {
            "google_id": google_id,
            "email": email,
            "name": name,
            "picture": picture,
            "completed_trips": 0,
            "redeem_points": 50,  # 50 welcome bonus points!
            "favorite_pandals": [],
            "created_at": now_iso,
            "last_login": now_iso,
        }
        result = await user_collection.insert_one(new_user_doc)
        user_id = str(result.inserted_id)
        user = new_user_doc
        user["_id"] = result.inserted_id
        logger.info("Created new user account: %s (%s)", email, user_id)
    else:
        user_id = str(user["_id"])
        # Update profile info on login
        await user_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "google_id": google_id,
                    "name": name,
                    "picture": picture,
                    "last_login": now_iso,
                }
            },
        )
        user["name"] = name
        user["picture"] = picture

    # Issue signed JWT token containing user_id
    access_token = create_access_token({"sub": user_id, "email": email, "name": name})

    profile = UserProfile(
        id=user_id,
        email=user.get("email", ""),
        name=user.get("name", ""),
        picture=user.get("picture"),
        completed_trips=user.get("completed_trips", 0),
        redeem_points=user.get("redeem_points", 0),
        favorite_pandals=user.get("favorite_pandals", []),
        created_at=user.get("created_at"),
    )

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=profile,
    )


@router.get("/me", response_model=UserProfile, summary="Get Current Authenticated User Profile")
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the currently logged in user's profile with real-time stats.
    Guarantees that User A only retrieves their own profile data.
    """
    # Count real saved/completed trips from user_trips collection
    trip_count = await db[settings.TRIP_COLLECTION_NAME].count_documents(
        {"user_id": current_user["id"]}
    )

    # Get favorite pandal IDs from user_favorites collection
    fav_docs = await db[settings.FAVORITE_COLLECTION_NAME].find(
        {"user_id": current_user["id"]}
    ).to_list(1000)
    favorite_pandals = [doc["pandal_id"] for doc in fav_docs if "pandal_id" in doc]

    return UserProfile(
        id=current_user["id"],
        email=current_user.get("email", ""),
        name=current_user.get("name", ""),
        picture=current_user.get("picture"),
        completed_trips=max(trip_count, current_user.get("completed_trips", 0)),
        redeem_points=current_user.get("redeem_points", 0),
        favorite_pandals=favorite_pandals,
        created_at=current_user.get("created_at"),
    )
