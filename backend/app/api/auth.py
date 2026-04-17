from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timedelta

from app.db.session import get_db_session
from app.models import User, EmailVerification
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    SendVerificationEmailRequest,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_email_verification_token,
)
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.services.email_service import get_email_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> LoginResponse:
    """
    Login with phone number and password.
    Returns access token and user information.
    User must have verified their email before login.
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

    # Check if email is verified (if verification is enabled)
    if settings.email_verification_enabled and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your email for the verification link.",
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


@router.post("/send-verification-email", response_model=dict)
async def send_verification_email(
    request: SendVerificationEmailRequest,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    Send email verification link to user.
    User must be registered (use phone number from registration).
    """
    if not settings.email_verification_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification is not enabled",
        )

    # Find user by email
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found. Please register first.",
        )

    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified",
        )

    # Generate verification token
    token = create_email_verification_token(str(user.id), user.email)
    expires_at = datetime.utcnow() + timedelta(hours=settings.email_verification_expiry_hours)

    # Delete old verification tokens for this user
    stmt = select(EmailVerification).where(
        (EmailVerification.user_id == user.id) & (EmailVerification.is_verified == False)
    )
    result = await db.execute(stmt)
    old_verifications = result.scalars().all()
    for old_v in old_verifications:
        await db.delete(old_v)

    # Create new verification record
    verification = EmailVerification(
        user_id=user.id,
        email=user.email,
        token=token,
        expires_at=expires_at,
        is_verified=False,
    )
    db.add(verification)
    await db.commit()

    # Send verification email
    verification_link = f"{settings.api_url}/auth/verify-email?token={token}"
    email_service = get_email_service()
    email_service.send_verification_email(
        recipient_email=user.email,
        verification_token=token,
        verification_link=verification_link,
    )

    return {
        "message": "Verification email sent successfully",
        "email": user.email,
    }


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db_session),
) -> VerifyEmailResponse:
    """
    Verify email using the token sent in verification email.
    """
    if not settings.email_verification_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification is not enabled",
        )

    # Find verification record by token
    stmt = select(EmailVerification).where(EmailVerification.token == request.token)
    result = await db.execute(stmt)
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    if verification.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified",
        )

    if verification.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Request a new one.",
        )

    # Get user and mark as verified
    stmt = select(User).where(User.id == verification.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Mark user and verification as verified
    user.is_verified = True
    verification.is_verified = True

    await db.commit()

    return VerifyEmailResponse(
        message="Email verified successfully. You can now login.",
        is_verified=True,
    )


@router.get("/verify-email", response_model=VerifyEmailResponse)
async def verify_email_get(
    token: str,
    db: AsyncSession = Depends(get_db_session),
) -> VerifyEmailResponse:
    """
    Verify email using GET request (for email link clicks).
    """
    if not settings.email_verification_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification is not enabled",
        )

    # Find verification record by token
    stmt = select(EmailVerification).where(EmailVerification.token == token)
    result = await db.execute(stmt)
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    if verification.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified",
        )

    if verification.is_expired():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Request a new one.",
        )

    # Get user and mark as verified
    stmt = select(User).where(User.id == verification.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Mark user and verification as verified
    user.is_verified = True
    verification.is_verified = True

    await db.commit()

    return VerifyEmailResponse(
        message="Email verified successfully. You can now login.",
        is_verified=True,
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

