from pydantic import BaseModel, Field, EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
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

