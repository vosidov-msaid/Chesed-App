from sqlalchemy import Column, String, Float, Integer, Boolean, Enum, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from enum import Enum as PyEnum
from app.db.base import Base, TimestampMixin


class FavorCategory(str, PyEnum):
    MOBILITY = "mobility"
    ERRANDS = "errands"
    FOOD = "food"
    BORROW_LEND = "borrow_lend"
    CARE = "care"
    MUSCLE = "muscle"
    PRESENCE = "presence"
    PRACTICAL_SKILLS = "practical_skills"


class RequestStatus(str, PyEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RequestTiming(str, PyEnum):
    NOW = "now"
    SCHEDULED = "scheduled"


class Request(Base, TimestampMixin):
    __tablename__ = "requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    category = Column(Enum(FavorCategory), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(255), nullable=True)
    
    timing = Column(Enum(RequestTiming), default=RequestTiming.NOW)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    
    status = Column(Enum(RequestStatus), default=RequestStatus.OPEN, index=True)
    urgency = Column(String(50), default="normal")
    
    is_public = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    
    requester = relationship("User", foreign_keys=[requester_id])
