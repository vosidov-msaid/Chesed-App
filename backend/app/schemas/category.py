from pydantic import BaseModel
from uuid import UUID


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    label: str
    emoji: str
    description: str | None = None
    color: str

    class Config:
        from_attributes = True
