from sqlalchemy import Column, String, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.base import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    label = Column(String(255), nullable=False)
    emoji = Column(String(10), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=False)  # Hex color code
    
    requests = relationship("Request", back_populates="category_obj")
