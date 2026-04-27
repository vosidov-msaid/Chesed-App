from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import List

from app.db.session import get_db_session
from app.models import Commitment, Request, User, CommitmentStatus, RequestStatus
from app.schemas.commitment import (
    CommitmentCreate,
    CommitmentResponse,
    CommitmentUpdate,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/commitments", tags=["commitments"])


@router.post("/", response_model=CommitmentResponse, status_code=status.HTTP_201_CREATED)
async def create_commitment(
    request_id: UUID = Query(..., description="ID of the request to commit to"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CommitmentResponse:
    """Helper accepts a request (creates a commitment)."""
    # Verify request exists and is open
    stmt_req = select(Request).where(Request.id == request_id)
    result_req = await db.execute(stmt_req)
    request_obj = result_req.scalar_one_or_none()

    if not request_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    if request_obj.status != RequestStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request is not open for commitments",
        )

    # Check if helper already committed to this request
    stmt_existing = select(Commitment).where(
        and_(
            Commitment.request_id == request_id,
            Commitment.helper_id == current_user.id,
        )
    )
    result_existing = await db.execute(stmt_existing)
    if result_existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already committed to this request",
        )

    new_commitment = Commitment(
        request_id=request_id,
        helper_id=current_user.id,
    )

    # Mark request as in_progress if this is the first commitment
    # Check BEFORE adding new commitment
    stmt_count = select(Commitment).where(
        Commitment.request_id == request_id
    )
    result_count = await db.execute(stmt_count)
    existing_commitments = result_count.scalars().all()

    db.add(new_commitment)

    if not existing_commitments:
        request_obj.status = RequestStatus.IN_PROGRESS

    await db.commit()
    await db.refresh(new_commitment)
    return new_commitment


@router.get("/{commitment_id}", response_model=CommitmentResponse)
async def get_commitment(
    commitment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CommitmentResponse:
    """Get a specific commitment (authenticated users only)."""
    stmt = select(Commitment).where(Commitment.id == commitment_id)
    result = await db.execute(stmt)
    commitment = result.scalar_one_or_none()

    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )
    return commitment


@router.get("/", response_model=List[CommitmentResponse])
async def list_commitments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    request_id: UUID = Query(None),
    helper_id: UUID = Query(None),
    status_filter: CommitmentStatus = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
) -> List[CommitmentResponse]:
    """List commitments with optional filters (authenticated users only)."""
    stmt = select(Commitment).offset(skip).limit(limit)

    if request_id:
        stmt = stmt.where(Commitment.request_id == request_id)

    if helper_id:
        stmt = stmt.where(Commitment.helper_id == helper_id)

    if status_filter:
        stmt = stmt.where(Commitment.status == status_filter)

    result = await db.execute(stmt)
    commitments = result.scalars().all()
    return commitments


@router.put("/{commitment_id}", response_model=CommitmentResponse)
async def update_commitment(
    commitment_id: UUID,
    commitment_update: CommitmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> CommitmentResponse:
    """Update commitment status (helper can accept/decline)."""
    stmt = select(Commitment).where(Commitment.id == commitment_id)
    result = await db.execute(stmt)
    commitment = result.scalar_one_or_none()

    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    if commitment.helper_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the helper can update this commitment",
        )

    update_data = commitment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(commitment, field, value)

    await db.commit()
    await db.refresh(commitment)
    return commitment


@router.delete("/{commitment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_commitment(
    commitment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Cancel a commitment."""
    stmt = select(Commitment).where(Commitment.id == commitment_id)
    result = await db.execute(stmt)
    commitment = result.scalar_one_or_none()

    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    if commitment.helper_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the helper can cancel this commitment",
        )

    commitment.status = CommitmentStatus.CANCELLED
    await db.commit()
