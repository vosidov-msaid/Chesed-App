#!/usr/bin/env python
"""
Seed test data into the database for testing all features.
Run this after migrations: python backend/scripts/seed_test_data.py
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv

# Load .env file from backend directory
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / ".env"
load_dotenv(env_file)

# Add backend to path
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.db.base import Base
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.request import Request, RequestStatus, RequestTiming
from app.models.commitment import Commitment, CommitmentStatus
from app.models.review import Review
from app.core.config import settings
from app.core.security import hash_password


# Test users data
TEST_USERS = [
    {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "phone_number": "+1234567890",
        "first_name": "John",
        "last_name": "Helper",
        "email": "john.helper@test.com",
        "password": "Test@1234",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "role": UserRole.BOTH,
        "bio": "Friendly neighbor always ready to help with anything!",
        "is_verified": True,
        "reputation_score": 45,
        "total_favors_given": 12,
        "total_favors_received": 5,
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "phone_number": "+1234567891",
        "first_name": "Sarah",
        "last_name": "Volunteer",
        "email": "sarah.volunteer@test.com",
        "password": "Test@1234",
        "latitude": 40.7128,
        "longitude": -74.0065,
        "role": UserRole.BOTH,
        "bio": "Love volunteering and helping the community",
        "is_verified": True,
        "reputation_score": 62,
        "total_favors_given": 18,
        "total_favors_received": 8,
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "phone_number": "+1234567892",
        "first_name": "Ahmed",
        "last_name": "Community",
        "email": "ahmed.community@test.com",
        "password": "Test@1234",
        "latitude": 40.7140,
        "longitude": -74.0050,
        "role": UserRole.BOTH,
        "bio": "Always available to support neighbors",
        "is_verified": True,
        "reputation_score": 38,
        "total_favors_given": 10,
        "total_favors_received": 7,
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "phone_number": "+1234567893",
        "first_name": "Emma",
        "last_name": "Supporter",
        "email": "emma.supporter@test.com",
        "password": "Test@1234",
        "latitude": 40.7120,
        "longitude": -74.0070,
        "role": UserRole.BOTH,
        "bio": "Retired teacher, love helping people",
        "is_verified": True,
        "reputation_score": 72,
        "total_favors_given": 25,
        "total_favors_received": 15,
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "phone_number": "+1234567894",
        "first_name": "Michael",
        "last_name": "Newcomer",
        "email": "michael.newcomer@test.com",
        "password": "Test@1234",
        "latitude": 40.7135,
        "longitude": -74.0055,
        "role": UserRole.BOTH,
        "bio": "New to the area, looking to meet neighbors",
        "is_verified": False,
        "reputation_score": 0,
        "total_favors_given": 0,
        "total_favors_received": 0,
    },
]

# Test requests data
def get_test_requests(user_ids, category_ids_dict):
    """Generate test requests with various statuses and timings."""
    requests_data = []
    now = datetime.utcnow()
    
    # Request 1: Open - Needs a ride NOW (from John)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440001"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440001"),
        "category_id": category_ids_dict.get("mobility"),
        "title": "Need a ride to downtown",
        "description": "Looking for someone to give me a ride to the downtown area. I have a doctor's appointment at 2 PM.",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_name": "Manhattan, NY",
        "timing": RequestTiming.NOW,
        "scheduled_at": None,
        "status": RequestStatus.OPEN,
        "urgency": "high",
        "is_public": True,
    })
    
    # Request 2: Open - Scheduled for tomorrow (from Sarah)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440002"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440002"),
        "category_id": category_ids_dict.get("errands"),
        "title": "Help with grocery shopping",
        "description": "Need help picking up groceries from the local store and bringing them home. I have a broken leg and mobility is limited.",
        "latitude": 40.7140,
        "longitude": -74.0065,
        "location_name": "Upper West Side, NY",
        "timing": RequestTiming.SCHEDULED,
        "scheduled_at": now + timedelta(days=1, hours=2),
        "status": RequestStatus.OPEN,
        "urgency": "normal",
        "is_public": True,
    })
    
    # Request 3: Open - Food delivery (from Ahmed)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440003"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440003"),
        "category_id": category_ids_dict.get("food"),
        "title": "Food delivery assistance",
        "description": "Looking for someone to help pick up a meal from my favorite restaurant and deliver it to my home. I'm recovering from surgery.",
        "latitude": 40.7150,
        "longitude": -74.0050,
        "location_name": "Central Park West, NY",
        "timing": RequestTiming.NOW,
        "scheduled_at": None,
        "status": RequestStatus.OPEN,
        "urgency": "normal",
        "is_public": True,
    })
    
    # Request 4: Open - Tools borrow (from Emma)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440004"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440004"),
        "category_id": category_ids_dict.get("borrow_lend"),
        "title": "Borrow a ladder",
        "description": "Need to borrow a 6-foot ladder for a weekend project. Happy to return it in perfect condition.",
        "latitude": 40.7120,
        "longitude": -74.0070,
        "location_name": "Park Slope, NY",
        "timing": RequestTiming.SCHEDULED,
        "scheduled_at": now + timedelta(days=2),
        "status": RequestStatus.OPEN,
        "urgency": "low",
        "is_public": True,
    })
    
    # Request 5: Open - Tech help (from Michael)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440005"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440005"),
        "category_id": category_ids_dict.get("practical_skills"),
        "title": "WiFi setup help needed",
        "description": "Just moved in and need help setting up my WiFi router. I'm not very tech-savvy.",
        "latitude": 40.7135,
        "longitude": -74.0055,
        "location_name": "Astoria, NY",
        "timing": RequestTiming.NOW,
        "scheduled_at": None,
        "status": RequestStatus.OPEN,
        "urgency": "normal",
        "is_public": True,
    })
    
    # Request 6: In Progress (from John)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440006"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440001"),
        "category_id": category_ids_dict.get("muscle"),
        "title": "Help moving furniture",
        "description": "Moving to a new apartment and need 2-3 people to help with heavy furniture.",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_name": "Manhattan, NY",
        "timing": RequestTiming.SCHEDULED,
        "scheduled_at": now + timedelta(days=3),
        "status": RequestStatus.IN_PROGRESS,
        "urgency": "high",
        "is_public": True,
    })
    
    # Request 7: Completed (from Sarah)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440007"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440002"),
        "category_id": category_ids_dict.get("presence"),
        "title": "Need company for an evening",
        "description": "Looking for someone to keep me company and chat over tea. Recently widowed and feeling lonely.",
        "latitude": 40.7140,
        "longitude": -74.0065,
        "location_name": "Upper West Side, NY",
        "timing": RequestTiming.SCHEDULED,
        "scheduled_at": now - timedelta(days=1),
        "status": RequestStatus.COMPLETED,
        "urgency": "normal",
        "is_public": True,
    })
    
    # Request 8: Cancelled (from Ahmed)
    requests_data.append({
        "id": uuid.UUID("650e8400-e29b-41d4-a716-446655440008"),
        "requester_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440003"),
        "category_id": category_ids_dict.get("care"),
        "title": "Babysitting needed",
        "description": "Need someone to babysit my 2 kids for a few hours this weekend.",
        "latitude": 40.7150,
        "longitude": -74.0050,
        "location_name": "Central Park West, NY",
        "timing": RequestTiming.SCHEDULED,
        "scheduled_at": now + timedelta(days=5),
        "status": RequestStatus.CANCELLED,
        "urgency": "normal",
        "is_public": True,
    })
    
    return requests_data


def seed_test_data():
    """Seed the database with comprehensive test data."""
    # Use synchronous database URL
    db_url = settings.database_url
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    engine = create_engine(db_url)
    
    # Create tables if they don't exist
    Base.metadata.create_all(engine)
    
    with Session(engine) as session:
        print("🌱 Starting test data seeding...\n")
        
        # Get existing counts
        user_count = session.query(User).filter(User.email == "john.helper@test.com").count()
        request_count = session.query(Request).count()
        commitment_count = session.query(Commitment).count()
        review_count = session.query(Review).count()
        
        if commitment_count > 0 and review_count > 0:
            print("✅ All test data already exists!")
            print(f"   - {user_count} users, {request_count} requests, {commitment_count} commitments, {review_count} reviews\n")
            engine.dispose()
            return
        
        # Skip users and requests seeding if they already exist
        existing_user = session.query(User).filter(User.email == "john.helper@test.com").first()
        
        if not existing_user:
            # Seed users
            print("👥 Seeding users...")
            user_ids = []
            for user_data in TEST_USERS:
                password = user_data.pop("password")
                user_data["hashed_password"] = hash_password(password)
                user_data["id"] = uuid.UUID(user_data["id"])
                
                new_user = User(**user_data)
                session.add(new_user)
                user_ids.append(new_user.id)
                print(f"  ✓ Added user: {user_data['first_name']} {user_data['last_name']}")
            
            session.commit()
            
            # Get categories
            print("\n📁 Loading categories...")
            categories = session.query(Category).all()
            category_ids_dict = {cat.name: cat.id for cat in categories}
            print(f"  ✓ Found {len(category_ids_dict)} categories")
            
            # Seed requests
            print("\n📋 Seeding requests...")
            requests_data = get_test_requests(user_ids, category_ids_dict)
            request_ids = []
            
            for req_data in requests_data:
                new_request = Request(**req_data)
                session.add(new_request)
                request_ids.append(new_request.id)
                print(f"  ✓ Added request: {req_data['title'][:40]}... ({req_data['status'].value})")
            
            session.commit()
        else:
            print("✓ Users and requests already exist, skipping...\n")
            # Fetch existing request IDs for commitments
            requests = session.query(Request).all()
            request_ids = [r.id for r in requests]
        
        # Seed commitments
        print("\n💼 Seeding commitments...")
        commitments_data = [
            {
                "id": uuid.uuid4(),
                "request_id": request_ids[0],  # Ride request
                "helper_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440002"),  # Sarah
                "status": CommitmentStatus.ACCEPTED,
                "notes": "I can help you get to your appointment!",
            },
            {
                "id": uuid.uuid4(),
                "request_id": request_ids[1],  # Grocery shopping
                "helper_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440004"),  # Emma
                "status": CommitmentStatus.ACCEPTED,
                "notes": "Happy to help with your groceries tomorrow",
            },
            {
                "id": uuid.uuid4(),
                "request_id": request_ids[2],  # Food delivery
                "helper_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440001"),  # John
                "status": CommitmentStatus.PENDING,
                "notes": "I can help with this",
            },
            {
                "id": uuid.uuid4(),
                "request_id": request_ids[5],  # Help moving
                "helper_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440003"),  # Ahmed
                "status": CommitmentStatus.ACCEPTED,
                "notes": "Count me in! I'm strong and available",
            },
            {
                "id": uuid.uuid4(),
                "request_id": request_ids[6],  # Company evening
                "helper_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440005"),  # Michael
                "status": CommitmentStatus.COMPLETED,
                "notes": "Had a wonderful evening together",
            },
        ]
        
        for i, commitment_data in enumerate(commitments_data):
            try:
                new_commitment = Commitment(**commitment_data)
                session.add(new_commitment)
                session.flush()
                print(f"  ✓ Added commitment {i+1}: {commitment_data['status'].value}")
            except Exception as e:
                print(f"  ✗ Failed to add commitment {i+1}: {e}")
                session.rollback()
        
        session.commit()
        
        # Seed reviews (one per commitment)
        print("\n⭐ Seeding reviews...")
        reviews_data = [
            {
                "id": uuid.uuid4(),
                "commitment_id": commitments_data[4]["id"],  # Completed commitment from company evening
                "reviewer_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440002"),  # Sarah (requester)
                "reviewed_user_id": uuid.UUID("550e8400-e29b-41d4-a716-446655440005"),  # Michael (helper)
                "rating": 5,
                "comment": "Michael was a wonderful companion. Great conversation and very respectful. Highly recommend!",
            },
        ]
        
        for i, review_data in enumerate(reviews_data):
            try:
                new_review = Review(**review_data)
                session.add(new_review)
                session.flush()
                print(f"  ✓ Added review {i+1}: {review_data['rating']} stars")
            except Exception as e:
                print(f"  ✗ Failed to add review {i+1}: {e}")
                session.rollback()
        
        session.commit()
        
        print("\n✅ Test data seeded successfully!")
        
        # Get counts for summary
        user_count = session.query(User).count()
        request_count = session.query(Request).count()
        commitment_count = session.query(Commitment).count()
        review_count = session.query(Review).count()
        category_count = session.query(Category).count()
        
        print(f"   - {user_count} users created")
        print(f"   - {category_count} categories")
        print(f"   - {request_count} requests created")
        print(f"   - {commitment_count} commitments created")
        print(f"   - {review_count} reviews created")
        print("\n📱 You can now test all features of the app!")
    
    engine.dispose()


if __name__ == "__main__":
    seed_test_data()
