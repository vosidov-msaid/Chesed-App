from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class MessageCreate(BaseModel):
    text: str


class MessageResponse(BaseModel):
    id: UUID
    commitment_id: UUID
    sender_id: UUID
    text: str
    created_at: datetime

    class Config:
        from_attributes = True
