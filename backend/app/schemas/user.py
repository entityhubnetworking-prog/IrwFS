"""
Pydantic schemas for API validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_verified: bool
    video_quota: int
    image_quota: int
    videos_used: int
    images_used: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None


# FaceSwap Schemas
class FaceSwapBase(BaseModel):
    swap_type: str = "image"


class FaceSwapCreate(FaceSwapBase):
    pass


class FaceSwapResponse(FaceSwapBase):
    id: int
    user_id: int
    status: str
    source_image_url: Optional[str]
    target_image_url: Optional[str]
    target_video_url: Optional[str]
    result_url: Optional[str]
    processing_time: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class FaceSwapList(BaseModel):
    items: List[FaceSwapResponse]
    total: int
    page: int
    pages: int


# Admin Schemas
class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None
    video_quota: Optional[int] = None
    image_quota: Optional[int] = None


class AdminUserResponse(UserResponse):
    is_active: bool
    is_admin: bool
    is_superadmin: bool
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


# Email Verification
class EmailVerificationRequest(BaseModel):
    email: EmailStr


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)


# API Response
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False
