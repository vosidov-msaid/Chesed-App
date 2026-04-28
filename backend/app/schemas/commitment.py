from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.commitment import CommitmentStatus


class CommitmentBase(BaseModel):
    notes: Optional[str] = None


class CommitmentCreate(CommitmentBase):
    request_id: UUID
    helper_id: UUID


class CommitmentUpdate(BaseModel):
    status: Optional[CommitmentStatus] = None
    notes: Optional[str] = None


class CommitmentResponse(CommitmentBase):
    id: UUID
    request_id: UUID
    helper_id: UUID
    status: CommitmentStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    commitment_id: UUID
    reviewed_user_id: UUID


class UserMinimal(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    
    class Config:
        from_attributes = True


class ReviewResponse(ReviewBase):
    id: UUID
    commitment_id: UUID
    reviewer_id: UUID
    reviewed_user_id: UUID
    created_at: datetime
    reviewer: Optional[UserMinimal] = None

    class Config:
        from_attributes = True
