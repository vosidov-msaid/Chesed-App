from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from typing import List

from app.db.session import get_db_session
from app.models import Message, Commitment, Request
from app.schemas.message import MessageCreate, MessageResponse
from app.core.dependencies import get_current_user
from app.models.user import User
from app.api.websocket import manager

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/{commitment_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    commitment_id: UUID,
    message_create: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    """Create a new message in a commitment chat."""
    # Verify commitment exists
    stmt_commit = select(Commitment).where(Commitment.id == commitment_id)
    result_commit = await db.execute(stmt_commit)
    commitment = result_commit.scalar_one_or_none()

    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    # Verify user is either helper or requester
    request_stmt = select(Request).where(Request.id == commitment.request_id)
    request_result = await db.execute(request_stmt)
    request_obj = request_result.scalar_one_or_none()

    is_helper = commitment.helper_id == current_user.id
    is_requester = request_obj and request_obj.requester_id == current_user.id

    if not (is_helper or is_requester):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only helper or requester can send messages",
        )

    new_message = Message(
        commitment_id=commitment_id,
        sender_id=current_user.id,
        text=message_create.text,
    )

    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)

    # Broadcast to both participants
    message_data = {
        "id": str(new_message.id),
        "commitment_id": str(new_message.commitment_id),
        "sender_id": str(new_message.sender_id),
        "text": new_message.text,
        "created_at": new_message.created_at.isoformat(),
    }

    # Send to helper
    await manager.broadcast_to_user(str(commitment.helper_id), {
        "type": "message_created",
        "data": message_data
    })

    # Send to requester
    if request_obj:
        await manager.broadcast_to_user(str(request_obj.requester_id), {
            "type": "message_created",
            "data": message_data
        })

    return new_message


@router.get("/{commitment_id}", response_model=List[MessageResponse])
async def get_messages(
    commitment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0),
    limit: int = Query(100),
) -> List[MessageResponse]:
    """Get all messages for a commitment."""
    # Verify commitment exists and user has access
    stmt_commit = select(Commitment).where(Commitment.id == commitment_id)
    result_commit = await db.execute(stmt_commit)
    commitment = result_commit.scalar_one_or_none()

    if not commitment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    # Verify user is either helper or requester
    request_stmt = select(Request).where(Request.id == commitment.request_id)
    request_result = await db.execute(request_stmt)
    request_obj = request_result.scalar_one_or_none()

    is_helper = commitment.helper_id == current_user.id
    is_requester = request_obj and request_obj.requester_id == current_user.id

    if not (is_helper or is_requester):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only helper or requester can view messages",
        )

    # Get messages ordered by creation time
    stmt = select(Message).where(
        Message.commitment_id == commitment_id
    ).order_by(Message.created_at).offset(skip).limit(limit)

    result = await db.execute(stmt)
    messages = result.scalars().all()
    return messages
