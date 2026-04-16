from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from uuid import UUID
from typing import List

from app.db.session import get_db_session
from app.models import Review, Commitment, User
from app.schemas.commitment import ReviewCreate, ReviewResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    commitment_id: UUID = Query(...),
    rating: int = Query(..., ge=1, le=5),
    comment: str = Query(None),
    reviewed_user_id: UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ReviewResponse:
    """Create a review for a completed commitment."""
    # Verify commitment exists
    stmt_commit = select(Commitment).where(Commitment.id == commitment_id)
    result_commit = await db.execute(stmt_commit)
    commitment = result_commit.scalar_one_or_none()

    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    # Check if review already exists for this commitment
    stmt_existing = select(Review).where(
        Review.commitment_id == commitment_id
    )
    result_existing = await db.execute(stmt_existing)
    if result_existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review already exists for this commitment",
        )

    # Verify reviewed user exists
    stmt_reviewed = select(User).where(User.id == reviewed_user_id)
    result_reviewed = await db.execute(stmt_reviewed)
    if not result_reviewed.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reviewed user not found",
        )

    new_review = Review(
        commitment_id=commitment_id,
        reviewer_id=current_user.id,
        reviewed_user_id=reviewed_user_id,
        rating=rating,
        comment=comment,
    )

    db.add(new_review)
    
    # Update reputation score of reviewed user
    reviewed_user = result_reviewed.scalar_one_or_none()
    if reviewed_user:
        # Get average rating for this user
        stmt_avg = select(func.avg(Review.rating)).where(
            Review.reviewed_user_id == reviewed_user_id
        )
        result_avg = await db.execute(stmt_avg)
        avg_rating = result_avg.scalar() or 0
        reviewed_user.reputation_score = int(avg_rating * 10)

    await db.commit()
    await db.refresh(new_review)
    return new_review


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ReviewResponse:
    """Get a specific review (authenticated users only)."""
    stmt = select(Review).where(Review.id == review_id)
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )
    return review


@router.get("/", response_model=List[ReviewResponse])
async def list_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    reviewed_user_id: UUID = Query(None),
    reviewer_id: UUID = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
) -> List[ReviewResponse]:
    """List reviews with optional filters (authenticated users only)."""
    stmt = select(Review).offset(skip).limit(limit)

    if reviewed_user_id:
        stmt = stmt.where(Review.reviewed_user_id == reviewed_user_id)

    if reviewer_id:
        stmt = stmt.where(Review.reviewer_id == reviewer_id)

    result = await db.execute(stmt)
    reviews = result.scalars().all()
    return reviews


@router.get("/user/{user_id}/received", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> List[ReviewResponse]:
    """Get all reviews received by a user (authenticated users only)."""
    stmt = select(Review).where(Review.reviewed_user_id == user_id)
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    return reviews
