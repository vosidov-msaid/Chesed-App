from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.request import FavorCategory, RequestStatus, RequestTiming


class RequestBase(BaseModel):
    category: FavorCategory
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    timing: RequestTiming = RequestTiming.NOW
    scheduled_at: Optional[datetime] = None
    urgency: str = "normal"
    notes: Optional[str] = None


class RequestCreate(RequestBase):
    pass


class RequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RequestStatus] = None
    notes: Optional[str] = None


class RequestResponse(RequestBase):
    id: UUID
    requester_id: UUID
    status: RequestStatus
    is_public: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
