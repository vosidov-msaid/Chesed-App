from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base, TimestampMixin


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commitment_id = Column(UUID(as_uuid=True), ForeignKey("commitments.id"), nullable=False, unique=True, index=True)
    
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, default=5)
    comment = Column(Text, nullable=True)
    
    commitment = relationship("Commitment", foreign_keys=[commitment_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewed_user = relationship("User", foreign_keys=[reviewed_user_id])
