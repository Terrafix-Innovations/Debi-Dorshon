"""
app/api/v1/endpoints/user.py
----------------------------
User-isolated endpoints for saving and retrieving personalized trips and favorites.
Every query strictly filters by `user_id = current_user["id"]` ensuring complete data sandboxing.
"""

from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_database
from app.api.deps import get_current_user
from app.schemas.auth import (
    UserTripSaveRequest,
    UserTripResponse,
    FavoriteToggleRequest,
    FavoriteResponse,
)

router = APIRouter()


@router.get("/trips", response_model=List[UserTripResponse], summary="List Current User's Saved Trips")
async def get_my_trips(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns only the trips planned and saved by the currently authenticated user.
    """
    cursor = db[settings.TRIP_COLLECTION_NAME].find(
        {"user_id": current_user["id"]}
    ).sort("created_at", -1)
    
    trip_docs = await cursor.to_list(100)
    results = []
    for doc in trip_docs:
        results.append(
            UserTripResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                title=doc.get("title") or f"{doc.get('origin_name', 'Start')} → {doc.get('destination_name', 'End')}",
                origin_name=doc.get("origin_name"),
                destination_name=doc.get("destination_name"),
                origin=doc.get("origin", {}),
                destination=doc.get("destination", {}),
                pandal_ids=doc.get("pandal_ids", []),
                pandals=doc.get("pandals", []),
                distance_km=doc.get("distance_km", 0.0),
                estimated_duration_mins=doc.get("estimated_duration_mins"),
                status=doc.get("status", "saved"),
                created_at=doc.get("created_at", ""),
            )
        )
    return results


@router.post("/trips", response_model=UserTripResponse, summary="Save Planned Trip to User's Account")
async def save_my_trip(
    payload: UserTripSaveRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Saves a planned Puja Parikrama trip exclusively to the authenticated user's account.
    Awards 25 reward points to the user for planning a trip!
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    title = payload.title or f"{payload.origin_name or 'Origin'} to {payload.destination_name or 'Destination'}"

    # Fetch basic details for associated pandals if IDs provided
    pandals_preview = []
    if payload.pandal_ids:
        # Fetch up to 20 pandals
        pandal_cursor = db[settings.PANDAL_COLLECTION_NAME].find(
            {"id": {"$in": payload.pandal_ids}}
        )
        p_docs = await pandal_cursor.to_list(20)
        for p in p_docs:
            pandals_preview.append({
                "id": p.get("id") or str(p["_id"]),
                "name": p.get("name"),
                "cluster": p.get("cluster"),
                "zone": p.get("zone"),
                "location": p.get("location"),
            })

    trip_doc = {
        "user_id": current_user["id"],
        "title": title,
        "origin_name": payload.origin_name,
        "destination_name": payload.destination_name,
        "origin": payload.origin,
        "destination": payload.destination,
        "pandal_ids": payload.pandal_ids,
        "pandals": pandals_preview,
        "distance_km": payload.distance_km,
        "estimated_duration_mins": payload.estimated_duration_mins,
        "status": payload.status,
        "created_at": now_iso,
    }

    result = await db[settings.TRIP_COLLECTION_NAME].insert_one(trip_doc)

    # Award 25 reward points
    await db[settings.USER_COLLECTION_NAME].update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$inc": {"redeem_points": 25, "completed_trips": 1}}
    )

    return UserTripResponse(
        id=str(result.inserted_id),
        user_id=current_user["id"],
        title=title,
        origin_name=payload.origin_name,
        destination_name=payload.destination_name,
        origin=payload.origin,
        destination=payload.destination,
        pandal_ids=payload.pandal_ids,
        pandals=pandals_preview,
        distance_km=payload.distance_km,
        estimated_duration_mins=payload.estimated_duration_mins,
        status=payload.status,
        created_at=now_iso,
    )


@router.delete("/trips/{trip_id}", summary="Delete a Saved Trip")
async def delete_my_trip(
    trip_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Deletes a saved trip from the user's account. Ensures only the owner can delete it.
    """
    try:
        obj_id = ObjectId(trip_id)
        query = {"_id": obj_id, "user_id": current_user["id"]}
    except Exception:
        query = {"_id": trip_id, "user_id": current_user["id"]}

    result = await db[settings.TRIP_COLLECTION_NAME].delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or you do not have permission to delete it.",
        )
    return {"message": "Trip successfully deleted", "trip_id": trip_id}


@router.get("/favorites", summary="Get User's Favorite Pandals")
async def get_my_favorites(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the list of favorite pandal objects for the authenticated user.
    """
    fav_cursor = db[settings.FAVORITE_COLLECTION_NAME].find({"user_id": current_user["id"]})
    fav_docs = await fav_cursor.to_list(500)
    pandal_ids = [d["pandal_id"] for d in fav_docs if "pandal_id" in d]

    if not pandal_ids:
        return {"favorite_ids": [], "pandals": []}

    # Fetch full pandal objects
    pandals = await db[settings.PANDAL_COLLECTION_NAME].find(
        {"id": {"$in": pandal_ids}}
    ).to_list(len(pandal_ids))

    # Format string IDs
    for p in pandals:
        p["_id"] = str(p["_id"])

    return {"favorite_ids": pandal_ids, "pandals": pandals}


@router.post("/favorites/toggle", response_model=FavoriteResponse, summary="Toggle Pandal Favorite")
async def toggle_favorite(
    payload: FavoriteToggleRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Adds or removes a pandal from the user's favorites list.
    """
    pandal_id = payload.pandal_id
    fav_col = db[settings.FAVORITE_COLLECTION_NAME]

    existing = await fav_col.find_one({"user_id": current_user["id"], "pandal_id": pandal_id})
    if existing:
        await fav_col.delete_one({"_id": existing["_id"]})
        is_fav = False
    else:
        await fav_col.insert_one({
            "user_id": current_user["id"],
            "pandal_id": pandal_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        is_fav = True

    # Return updated list of IDs
    all_favs = await fav_col.find({"user_id": current_user["id"]}).to_list(500)
    fav_ids = [d["pandal_id"] for d in all_favs if "pandal_id" in d]

    return FavoriteResponse(
        pandal_id=pandal_id,
        is_favorite=is_fav,
        favorite_pandals=fav_ids,
    )
