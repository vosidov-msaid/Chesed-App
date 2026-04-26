from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List
from math import radians, cos, sin, asin, sqrt

from app.db.session import get_db_session
from app.models import Request, User, RequestStatus
from app.models.category import Category
from app.models.request import FavorCategory
from app.schemas.request import RequestCreate, RequestResponse, RequestUpdate
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate distance between two coordinates in kilometers."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km


def request_to_response(req: Request) -> RequestResponse:
    """Convert Request model to RequestResponse with category name."""
    response = RequestResponse.model_validate(req)
    response.category = req.category_obj.name if req.category_obj else "unknown"
    return response


@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: RequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RequestResponse:
    """Create a new favor request."""
    # Find category by name
    category_name = request_data.category.value if hasattr(request_data.category, 'value') else str(request_data.category)
    stmt = select(Category).where(Category.name == category_name)
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_name}' not found. Available categories must be seeded first.",
        )
    
    new_request = Request(
        requester_id=current_user.id,
        category_id=category.id,
        title=request_data.title,
        description=request_data.description,
        latitude=request_data.latitude,
        longitude=request_data.longitude,
        location_name=request_data.location_name,
        timing=request_data.timing,
        scheduled_at=request_data.scheduled_at,
        urgency=request_data.urgency,
        notes=request_data.notes,
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    
    # Convert to response manually to include category name
    response = RequestResponse.model_validate(new_request)
    response.category = category.name
    return response


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RequestResponse:
    """Get a specific request by ID (authenticated users only)."""
    stmt = select(Request).where(Request.id == request_id).options(selectinload(Request.category_obj))
    result = await db.execute(stmt)
    request_obj = result.scalar_one_or_none()

    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    return request_to_response(request_obj)


@router.get("/", response_model=List[RequestResponse])
async def list_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    status_filter: RequestStatus = Query(None, description="Filter by request status"),
    skip: int = Query(0),
    limit: int = Query(100),
) -> List[RequestResponse]:
    """List all public requests with optional status filter (authenticated users only)."""
    stmt = select(Request).where(Request.is_public == True).options(selectinload(Request.category_obj)).offset(skip).limit(limit)

    if status_filter:
        stmt = stmt.where(Request.status == status_filter)

    result = await db.execute(stmt)
    requests = result.scalars().all()
    return [request_to_response(req) for req in requests]


@router.get("/nearby/search", response_model=List[RequestResponse])
async def get_nearby_requests(
    latitude: float = Query(..., description="User latitude"),
    longitude: float = Query(..., description="User longitude"),
    radius_km: float = Query(5.0, description="Search radius in kilometers"),
    category: str = Query(None, description="Filter by favor category"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[RequestResponse]:
    """Get requests nearby user's location within specified radius (authenticated users only)."""
    stmt = select(Request).where(
        and_(
            Request.is_public == True,
            Request.status == RequestStatus.OPEN,
        )
    ).options(selectinload(Request.category_obj))

    if category:
        cat_stmt = select(Category).where(Category.name == category)
        cat_result = await db.execute(cat_stmt)
        cat_obj = cat_result.scalar_one_or_none()
        if cat_obj:
            stmt = stmt.where(Request.category_id == cat_obj.id)

    result = await db.execute(stmt)
    all_requests = result.scalars().all()

    # Filter by distance
    nearby = []
    for req in all_requests:
        distance = haversine(longitude, latitude, req.longitude, req.latitude)
        if distance <= radius_km:
            nearby.append(req)

    return [request_to_response(req) for req in nearby]


@router.put("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: UUID,
    request_update: RequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> RequestResponse:
    """Update a request (only by requester)."""
    stmt = select(Request).where(Request.id == request_id)
    result = await db.execute(stmt)
    request_obj = result.scalar_one_or_none()

    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    if request_obj.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only requester can update this request",
        )

    update_data = request_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(request_obj, field, value)

    await db.commit()
    await db.refresh(request_obj)
    return request_obj


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Cancel a request (only by requester)."""
    stmt = select(Request).where(Request.id == request_id)
    result = await db.execute(stmt)
    request_obj = result.scalar_one_or_none()

    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    if request_obj.requester_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only requester can cancel this request",
        )

    request_obj.status = RequestStatus.CANCELLED
    await db.commit()
