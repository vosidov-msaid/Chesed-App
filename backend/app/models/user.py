from sqlalchemy import Column, String, Float, Integer, Boolean, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from enum import Enum as PyEnum
from app.db.base import Base, TimestampMixin


class UserRole(str, PyEnum):
    RIDER = "rider"
    DRIVER = "driver"
    BOTH = "both"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    operating_radius_km = Column(Float, default=5.0)
    
    role = Column(Enum(UserRole), default=UserRole.BOTH)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    bio = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    reputation_score = Column(Integer, default=0)
    total_favors_given = Column(Integer, default=0)
    total_favors_received = Column(Integer, default=0)
