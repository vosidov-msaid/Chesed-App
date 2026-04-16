from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.init_db import init_admin_user
from app.api import auth, users, requests, commitments, reviews, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("\n" + "="*60)
    print("Chesed API Starting...")
    print("="*60)
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
app.include_router(reviews.router)
