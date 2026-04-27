from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.models import User, UserRole
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal


async def init_admin_user():
    """Initialize admin user on app startup if not exists."""
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        stmt = select(User).where(User.phone_number == "+992928245080")
        result = await db.execute(stmt)
        
        if result.scalar_one_or_none():
            print("✓ Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            id=uuid4(),
            phone_number="+992928245080",
            first_name="Admin",
            last_name="User",
            email="admin@chesedapp.com",
            hashed_password=hash_password("928245080_Vm"),
            role=UserRole.BOTH,
            is_active=True,
            is_verified=True,
            reputation_score=100,
        )
        
        db.add(admin)
        await db.commit()
        print("✓ Admin user created successfully")
