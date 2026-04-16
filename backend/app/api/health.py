from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    message: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Chesed API is running"}


@router.get("/", response_model=dict)
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Chesed API",
        "version": "1.0.0",
        "description": "Location-aware favor sharing mobile app",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
