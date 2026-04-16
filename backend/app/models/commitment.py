from sqlalchemy import Column, String, Boolean, Enum, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from enum import Enum as PyEnum
from app.db.base import Base, TimestampMixin


class CommitmentStatus(str, PyEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Commitment(Base, TimestampMixin):
    __tablename__ = "commitments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("requests.id"), nullable=False, index=True)
    helper_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    status = Column(Enum(CommitmentStatus), default=CommitmentStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)
    
    request = relationship("Request", foreign_keys=[request_id])
    helper = relationship("User", foreign_keys=[helper_id])
