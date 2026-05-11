from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8)

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate phone number: only digits and + prefix allowed."""
        if not re.match(r'^\+?[0-9]{10,20}$', v):
            raise ValueError('Phone number must contain only digits and optional + prefix. Example: +1234567890 or 1234567890')
        return v

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


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    first_name: str
    last_name: str


class LoginPendingVerificationResponse(BaseModel):
    message: str
    is_verified: bool = False
    user_id: str
    first_name: str
    last_name: str


class SendVerificationEmailRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=1)


class VerifyEmailResponse(BaseModel):
    message: str
    is_verified: bool


class RefreshTokenRequest(BaseModel):
    """Request body for token refresh (optional, can use existing token)."""
    pass


class LogoutResponse(BaseModel):
    """Response after logout."""
    message: str
    status: str = "success"

