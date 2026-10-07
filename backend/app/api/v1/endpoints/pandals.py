"""
app/api/v1/endpoints/pandals.py
--------------------------------
RESTful API routes for Durga Puja Pandals.
Acts like Express routes (e.g. `router.get('/', ...)`).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.schemas.pandal import PandalResponse
from app.services.pandal_service import PandalService

router = APIRouter()


def get_pandal_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> PandalService:
    """Dependency helper providing PandalService instance."""
    return PandalService(db)


@router.get(
    "/",
    response_model=List[PandalResponse],
    summary="Get all pandals with optional search and filters"
)
async def list_pandals(
    response: Response,
    region: Optional[str] = Query(None, description="Filter by region (e.g., North, South)"),
    cluster: Optional[str] = Query(None, description="Filter by cluster (e.g., Shyambazar)"),
    search: Optional[str] = Query(None, description="Search pandal by name"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    service: PandalService = Depends(get_pandal_service)
):
    """Retrieve list of Durga Puja pandals."""
    # Cache publicly for 1 hour to reduce backend latency
    response.headers["Cache-Control"] = "public, max-age=3600"
    return await service.get_all_pandals(
        region=region,
        cluster=cluster,
        search=search,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{pandal_id}",
    response_model=PandalResponse,
    summary="Get pandal details by ID"
)
async def get_pandal(
    pandal_id: str,
    service: PandalService = Depends(get_pandal_service)
):
    """Retrieve a specific pandal using its MongoDB ObjectId."""
    pandal = await service.get_pandal_by_id(pandal_id)
    if not pandal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pandal with ID '{pandal_id}' not found."
        )
    return pandal

