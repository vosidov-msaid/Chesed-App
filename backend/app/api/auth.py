from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.db.session import get_db_session
from app.models import User
from app.schemas.auth import LoginRequest, LoginResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> LoginResponse:
    """
    Login with phone number and password.
    Returns access token and user information.
    """
    # Find user by phone number
    stmt = select(User).where(User.phone_number == credentials.phone_number)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    # Create access token
    access_token = create_access_token(str(user.id))

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
    )


@router.post("/token", response_model=TokenResponse)
async def get_token(
    current_user: User = Depends(get_current_user),
) -> TokenResponse:
    """
    Get a new token (used to refresh or verify current token).
    Requires valid Bearer token.
    """
    access_token = create_access_token(str(current_user.id))
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/me", response_model=dict)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get current authenticated user's profile.
    Requires valid Bearer token.
    """
    return {
        "id": str(current_user.id),
        "phone_number": current_user.phone_number,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "role": current_user.role,
        "reputation_score": current_user.reputation_score,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
    }
