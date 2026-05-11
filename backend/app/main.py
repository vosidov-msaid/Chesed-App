from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.core.init_db import init_admin_user
from app.services.email_service import init_email_service
from app.api import auth, users, requests, commitments, reviews, health, websocket, messages


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("\n" + "="*60)
    print("Chesed API Starting...")
    print("="*60)
    
    # Initialize email service
    email_config = {
        "use_mock": settings.use_mock_email,
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "sender_email": settings.sender_email,
        "sender_name": settings.sender_name,
        "username": settings.smtp_username,
        "password": settings.smtp_password,
    }
    init_email_service(email_config)
    email_mode = "MOCK (console only)" if settings.use_mock_email else "PRODUCTION"
    print(f"Email Service: {email_mode}")
    
    await init_admin_user()
    print("="*60 + "\n")
    
    yield
    
    # Shutdown
    print("\nChesed API Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    debug=settings.debug,
    description="FastAPI backend for Chesed - location-aware favor sharing app",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(requests.router)
app.include_router(commitments.router)
app.include_router(messages.router)
app.include_router(reviews.router)
app.include_router(websocket.router)

# Mount static files directory for serving uploaded photos
upload_dir = Path("uploads")
upload_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
