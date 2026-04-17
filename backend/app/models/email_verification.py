from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timedelta
from app.db.base import Base


class EmailVerification(Base):
    """Store email verification tokens for users."""
    __tablename__ = "email_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    def is_expired(self) -> bool:
        """Check if verification token has expired."""
        return datetime.utcnow() > self.expires_at

    def is_valid(self) -> bool:
        """Check if token is valid and not expired."""
        return not self.is_expired() and not self.is_verified
