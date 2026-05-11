from sqlalchemy import Column, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base, TimestampMixin


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commitment_id = Column(UUID(as_uuid=True), ForeignKey("commitments.id"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    text = Column(Text, nullable=False)

    commitment = relationship("Commitment", foreign_keys=[commitment_id])
    sender = relationship("User", foreign_keys=[sender_id])
