#!/usr/bin/env python
"""
Seed categories into the database.
Run this after migrations: python backend/scripts/seed_categories_sync.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, select
from app.db.base import Base
from app.models.category import Category
from app.core.config import settings

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


def seed_categories():
    """Seed the categories table with predefined categories."""
    # Create engine
    engine = create_engine(settings.database_url)
    
    # Create tables if they don't exist
    Base.metadata.create_all(engine)
    
    with engine.begin() as connection:
        for cat_data in CATEGORIES_DATA:
            # Check if category exists
            result = connection.execute(
                select(Category).where(Category.name == cat_data["name"])
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                new_category = Category(**cat_data)
                connection.add(new_category)
                print(f"✓ Added category: {cat_data['name']}")
            else:
                print(f"✓ Category already exists: {cat_data['name']}")
        
        connection.commit()
    
    print("\n✅ Categories seeded successfully!")
    engine.dispose()


if __name__ == "__main__":
    seed_categories()
