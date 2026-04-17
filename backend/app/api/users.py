from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
from datetime import datetime, timedelta
import os
import shutil
from pathlib import Path

from app.db.session import get_db_session
from app.models import User, EmailVerification
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import hash_password, create_email_verification_token
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.services.email_service import get_email_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Register a new user with phone number and password.
    
    If email verification is enabled, an email will be sent with verification link.
    User must verify email before login.
    """
    # Check if user already exists
    stmt = select(User).where(User.phone_number == user_data.phone_number)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number already exists",
        )

    # Check if email already exists (if provided)
    if user_data.email:
        stmt = select(User).where(User.email == user_data.email)
        result = await db.execute(stmt)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists",
            )

    # Hash password
    hashed_password = hash_password(user_data.password)

    new_user = User(
        phone_number=user_data.phone_number,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role,
        is_verified=False,  # Default to unverified
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # If email verification is enabled and user provided email, send verification email
    if settings.email_verification_enabled and new_user.email:
        # Generate verification token
        token = create_email_verification_token(str(new_user.id), new_user.email)
        expires_at = datetime.utcnow() + timedelta(hours=settings.email_verification_expiry_hours)

        # Create verification record
        verification = EmailVerification(
            user_id=new_user.id,
            email=new_user.email,
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
            recipient_email=new_user.email,
            verification_token=token,
            verification_link=verification_link,
        )

    return new_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Get user profile by ID (authenticated users can view any profile)."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Update user profile (only own profile)."""
    # Check if user is updating their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile",
        )

    # Update only provided fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
) -> List[UserResponse]:
    """List all users with pagination (authenticated users only)."""
    stmt = select(User).offset(skip).limit(limit)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Deactivate user account (only own account)."""
    # Check if user is deleting their own account
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only deactivate your own account",
        )

    current_user.is_active = False
    await db.commit()


@router.post("/{user_id}/upload-photo")
async def upload_user_photo(
    user_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> UserResponse:
    """Upload a profile photo for the user."""
    # Check if user is updating their own profile
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload photos for your own profile",
        )

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/photos")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{user_id}{file_extension}"
    file_path = upload_dir / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save photo",
        )

    # Update user photo_url
    photo_url = f"/uploads/photos/{unique_filename}"
    current_user.photo_url = photo_url
    await db.commit()
    await db.refresh(current_user)

    return current_user
