"""
Admin API endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_admin_user, get_current_superadmin
from app.models.user import User, FaceSwap
from app.schemas.user import (
    AdminUserResponse, AdminUserUpdate, MessageResponse
)
from passlib.context import CryptContext

router = APIRouter(prefix="/admin", tags=["Admin"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    query = select(User)
    
    if search:
        query = query.where(
            User.email.ilike(f"%{search}%") | 
            User.username.ilike(f"%{search}%")
        )
    
    query = query.order_by(desc(User.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: int,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user details (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    update_data: AdminUserUpdate,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent modifying superadmin unless you are superadmin
    if user.is_superadmin and not admin_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Cannot modify superadmin")
    
    # Update fields
    if update_data.is_active is not None:
        user.is_active = update_data.is_active
    if update_data.is_admin is not None:
        user.is_admin = update_data.is_admin
    if update_data.role is not None:
        user.role = update_data.role
    if update_data.video_quota is not None:
        user.video_quota = update_data.video_quota
    if update_data.image_quota is not None:
        user.image_quota = update_data.image_quota
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: int,
    superadmin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """Delete user (superadmin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_superadmin:
        raise HTTPException(status_code=403, detail="Cannot delete superadmin")
    
    await db.delete(user)
    await db.commit()
    
    return MessageResponse(message="User deleted successfully")


@router.get("/users/{user_id}/password", response_model=dict)
async def view_user_password(
    user_id: int,
    superadmin: User = Depends(get_current_superadmin),
    db: AsyncSession = Depends(get_db)
):
    """
    View user's plaintext password (superadmin only)
    Note: This is a security risk and should be used with caution
    """
    # This endpoint would need to store passwords in plaintext
    # which is a security anti-pattern. 
    # For the requirement, we'll return a placeholder.
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # In a real implementation, you would need to:
    # 1. Store passwords in a reversible encryption (NOT recommended)
    # 2. Or use a separate password store
    
    # For now, return a warning message
    return {
        "user_id": user_id,
        "email": user.email,
        "password": "Feature requires password storage in reversible format",
        "warning": "This feature is a security risk and should be reconsidered"
    }


@router.get("/stats", response_model=dict)
async def get_stats(
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system statistics (admin only)"""
    # Count users
    users_result = await db.execute(select(User))
    total_users = len(users_result.scalars().all())
    
    # Count active users
    active_result = await db.execute(select(User).where(User.is_active == True))
    active_users = len(active_result.scalars().all())
    
    # Count face swaps
    swaps_result = await db.execute(select(FaceSwap))
    total_swaps = len(swaps_result.scalars().all())
    
    # Count completed swaps
    completed_result = await db.execute(
        select(FaceSwap).where(FaceSwap.status == "completed")
    )
    completed_swaps = len(completed_result.scalars().all())
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_face_swaps": total_swaps,
        "completed_swaps": completed_swaps
    }
