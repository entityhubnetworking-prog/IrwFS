"""
Database models for IrwFS
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Role & Status
    role = Column(String(20), default=UserRole.FREE)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_superadmin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Quota
    video_quota = Column(Integer, default=3)
    image_quota = Column(Integer, default=10)
    videos_used = Column(Integer, default=0)
    images_used = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    face_swaps = relationship("FaceSwap", back_populates="user", cascade="all, delete-orphan")
    
    def check_video_quota(self) -> bool:
        return self.videos_used < self.video_quota
    
    def check_image_quota(self) -> bool:
        return self.images_used < self.image_quota
    
    def use_video_quota(self):
        if self.check_video_quota():
            self.videos_used += 1
            return True
        return False
    
    def use_image_quota(self):
        if self.check_image_quota():
            self.images_used += 1
            return True
        return False


class SwapType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    LIVESTREAM = "livestream"


class SwapStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class FaceSwap(Base):
    __tablename__ = "face_swaps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Swap details
    swap_type = Column(String(20), default=SwapType.IMAGE)
    status = Column(String(20), default=SwapStatus.PENDING)
    
    # File URLs
    source_image_url = Column(String(500), nullable=True)
    target_image_url = Column(String(500), nullable=True)
    target_video_url = Column(String(500), nullable=True)
    result_url = Column(String(500), nullable=True)
    
    # Processing info
    processing_time = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="face_swaps")


class VerificationToken(Base):
    __tablename__ = "verification_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    token_type = Column(String(20), default="email_verification")  # email_verification, password_reset
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_hash = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
