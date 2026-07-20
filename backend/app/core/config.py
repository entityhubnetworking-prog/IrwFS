"""
IrwFS Backend - Face Swap Ecosystem
Main application configuration
"""
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "IrwFS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str
    DATABASE_URL_SYNC: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Tencent Cloud
    TENCENT_SECRET_ID: str = ""
    TENCENT_SECRET_KEY: str = ""
    TENCENT_BUCKET: str = ""
    TENCENT_REGION: str = "ap-jakarta"
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@irwfs.com"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    # GPU
    USE_GPU: bool = True
    ONNX_PROVIDER: str = "CUDAExecutionProvider"
    
    # Quota
    FREE_USER_VIDEO_QUOTA: int = 3
    FREE_USER_IMAGE_QUOTA: int = 10
    
    # Admin (set via environment variables in production)
    SUPERADMIN_EMAIL: str = "admin@example.com"
    SUPERADMIN_PASSWORD: str = "change_me_in_production"
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
