from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.user import UserRole
import re


class UserBase(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.BOTH

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate phone number: only digits and + prefix allowed."""
        if not re.match(r'^\+?[0-9]{10,20}$', v):
            raise ValueError('Phone number must contain only digits and optional + prefix. Example: +1234567890 or 1234567890')
        return v


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength: at least 8 chars with uppercase, lowercase, and digit."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_radius_km: Optional[float] = None


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool
    reputation_score: int
    total_favors_given: int
    total_favors_received: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

