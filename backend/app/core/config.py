from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "Chesed API"
    debug: bool = False
    api_version: str = "v1"
    
    database_url: str = "postgresql+asyncpg://user:password@localhost/chesed_db"
    
    secret_key: str = Field(..., description="Secret key for JWT. Must be set via .env file for security.")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    
    # Email configuration
    email_verification_enabled: bool = True
    email_verification_expiry_hours: int = 24
    use_mock_email: bool = False
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: str = "noreply@chesed.app"
    sender_name: str = "Chesed"
    
    # App URL for verification links
    app_url: str = "https://chesed.app"
    api_url: str = "https://api.chesed.app"
    
    cors_origins: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

