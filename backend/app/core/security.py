from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from app.core.config import settings
import secrets

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData(BaseModel):
    user_id: str
    exp: Optional[datetime] = None


class VerificationTokenData(BaseModel):
    user_id: str
    email: str
    token_type: str = "email_verification"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password. Truncate to 72 bytes for bcrypt."""
    # Truncate password to 72 bytes to match hashing process
    password_bytes = plain_password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.verify(password_truncated, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt. Bcrypt has a 72-byte limit."""
    # Truncate password to 72 bytes to comply with bcrypt limit
    password_bytes = password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password_truncated)


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {"user_id": str(user_id), "exp": expire}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def create_email_verification_token(user_id: str, email: str) -> str:
    """Create a secure token for email verification (24 hours expiry)."""
    # Generate a random token
    token = secrets.token_urlsafe(32)
    return token


def verify_token(token: str) -> Optional[TokenData]:
    """Verify a JWT token and return the user_id."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        user_id: str = payload.get("user_id")
        if user_id is None:
            return None
        return TokenData(user_id=user_id)
    except JWTError:
        return None

