from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import users, requests, commitments, reviews, health

app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    debug=settings.debug,
    description="FastAPI backend for Chesed - location-aware favor sharing app",
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
app.include_router(users.router)
app.include_router(requests.router)
app.include_router(commitments.router)
app.include_router(reviews.router)
