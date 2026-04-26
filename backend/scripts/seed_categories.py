import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.category import Category
from app.models.request import FavorCategory

CATEGORIES_DATA = [
    {
        "name": "mobility",
        "label": "RIDES & LIFTS",
        "emoji": "🚗",
        "description": "Need a ride or transportation help?",
        "color": "#4b6368",
    },
    {
        "name": "errands",
        "label": "PICKUP & DROP",
        "emoji": "📦",
        "description": "Help with errands and logistics",
        "color": "#3c6a35",
    },
    {
        "name": "food",
        "label": "DELIVERY & SUPPORT",
        "emoji": "🍲",
        "description": "Need food or meal delivery?",
        "color": "#865406",
    },
    {
        "name": "borrow_lend",
        "label": "TOOLS & ITEMS",
        "emoji": "🛠️",
        "description": "Borrow or lend tools and items",
        "color": "#5d3800",
    },
    {
        "name": "care",
        "label": "KIDS & ELDERLY",
        "emoji": "👶",
        "description": "Childcare or eldercare support",
        "color": "#376430",
    },
    {
        "name": "muscle",
        "label": "HEAVY LIFTING",
        "emoji": "💪",
        "description": "Need help moving or lifting?",
        "color": "#694000",
    },
    {
        "name": "presence",
        "label": "VISITING & COMPANY",
        "emoji": "🫂",
        "description": "Need someone to visit or keep you company?",
        "color": "#475f64",
    },
    {
        "name": "practical_skills",
        "label": "TECH & REPAIR",
        "emoji": "🔧",
        "description": "Need tech or repair help?",
        "color": "#5a3f35",
    },
]


async def seed_categories():
    """Seed the categories table with predefined categories."""
    async with AsyncSessionLocal() as session:
        for cat_data in CATEGORIES_DATA:
            stmt = select(Category).where(Category.name == cat_data["name"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            if not existing:
                new_category = Category(**cat_data)
                session.add(new_category)
                print(f"Added category: {cat_data['name']}")

        await session.commit()
        print("Categories seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_categories())
