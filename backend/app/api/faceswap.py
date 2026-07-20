"""
Face Swap API endpoints
"""
import os
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, FaceSwap, SwapType, SwapStatus
from app.schemas.user import FaceSwapResponse, FaceSwapList, MessageResponse
from app.services.storage_service import storage_service
from app.services.face_swap_service import get_face_swap_service

router = APIRouter(prefix="/faceswap", tags=["Face Swap"])


@router.post("/image", response_model=FaceSwapResponse)
async def swap_image(
    source: UploadFile = File(..., description="Source face image"),
    target: UploadFile = File(..., description="Target image to swap face onto"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Swap face from source image to target image
    """
    # Check quota
    if not current_user.check_image_quota():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Image quota exceeded. Please upgrade to premium."
        )
    
    # Validate file types
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if source.content_type not in allowed_types or target.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")
    
    # Save uploaded files
    source_content = await source.read()
    target_content = await target.read()
    
    source_path = storage_service.generate_upload_path(
        current_user.id, source.filename, "sources"
    )
    target_path = storage_service.generate_upload_path(
        current_user.id, target.filename, "targets"
    )
    
    source_url = storage_service.upload_file(source_content, source_path, source.content_type)
    target_url = storage_service.upload_file(target_content, target_path, target.content_type)
    
    # Create face swap record
    face_swap = FaceSwap(
        user_id=current_user.id,
        swap_type=SwapType.IMAGE,
        status=SwapStatus.PENDING,
        source_image_url=source_url,
        target_image_url=target_url
    )
    db.add(face_swap)
    await db.commit()
    await db.refresh(face_swap)
    
    try:
        # Process face swap
        face_swap.status = SwapStatus.PROCESSING
        await db.commit()
        
        # Save files temporarily for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as src_tmp:
            src_tmp.write(source_content)
            src_tmp_path = src_tmp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tgt_tmp:
            tgt_tmp.write(target_content)
            tgt_tmp_path = tgt_tmp.name
        
        # Perform face swap
        swap_service = get_face_swap_service()
        source_img = swap_service.image_to_numpy(src_tmp_path)
        target_img = swap_service.image_to_numpy(tgt_tmp_path)
        
        result_img, processing_time = swap_service.swap_face(source_img, target_img)
        
        # Save result
        result_path = storage_service.generate_upload_path(
            current_user.id, "result.jpg", "results"
        )
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as result_tmp:
            swap_service.numpy_to_image(result_img, result_tmp.name)
            with open(result_tmp.name, "rb") as f:
                result_content = f.read()
        
        result_url = storage_service.upload_file(result_content, result_path, "image/jpeg")
        
        # Update record
        face_swap.status = SwapStatus.COMPLETED
        face_swap.result_url = result_url
        face_swap.processing_time = processing_time
        current_user.use_image_quota()
        
        # Cleanup temp files
        os.unlink(src_tmp_path)
        os.unlink(tgt_tmp_path)
        
        await db.commit()
        await db.refresh(face_swap)
        
    except Exception as e:
        face_swap.status = SwapStatus.FAILED
        face_swap.error_message = str(e)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Face swap failed: {str(e)}")
    
    return face_swap


@router.post("/video", response_model=FaceSwapResponse)
async def swap_video(
    source: UploadFile = File(..., description="Source face image"),
    target: UploadFile = File(..., description="Target video to swap face onto"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Swap face from source image to target video
    """
    # Check quota
    if not current_user.check_video_quota():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Video quota exceeded. Please upgrade to premium."
        )
    
    # Validate file types
    allowed_video_types = ["video/mp4", "video/webm", "video/quicktime"]
    allowed_image_types = ["image/jpeg", "image/png", "image/webp"]
    
    if source.content_type not in allowed_image_types:
        raise HTTPException(status_code=400, detail="Source must be an image")
    
    if target.content_type not in allowed_video_types:
        raise HTTPException(status_code=400, detail="Target must be a video (MP4, WebM, MOV)")
    
    # Save uploaded files
    source_content = await source.read()
    target_content = await target.read()
    
    source_path = storage_service.generate_upload_path(
        current_user.id, source.filename, "sources"
    )
    target_path = storage_service.generate_upload_path(
        current_user.id, target.filename, "targets"
    )
    
    source_url = storage_service.upload_file(source_content, source_path, source.content_type)
    target_url = storage_service.upload_file(target_content, target_path, target.content_type)
    
    # Create face swap record
    face_swap = FaceSwap(
        user_id=current_user.id,
        swap_type=SwapType.VIDEO,
        status=SwapStatus.PENDING,
        source_image_url=source_url,
        target_video_url=target_url
    )
    db.add(face_swap)
    await db.commit()
    await db.refresh(face_swap)
    
    try:
        # Process face swap (this would typically be done in a background task)
        face_swap.status = SwapStatus.PROCESSING
        await db.commit()
        
        # Save files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as src_tmp:
            src_tmp.write(source_content)
            src_tmp_path = src_tmp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tgt_tmp:
            tgt_tmp.write(target_content)
            tgt_tmp_path = tgt_tmp.name
        
        output_path = tempfile.mktemp(suffix=".mp4")
        
        # Perform video face swap
        swap_service = get_face_swap_service()
        source_img = swap_service.image_to_numpy(src_tmp_path)
        
        result_path, processing_time = swap_service.swap_face_video(
            source_img, tgt_tmp_path, output_path
        )
        
        # Upload result
        with open(result_path, "rb") as f:
            result_content = f.read()
        
        result_url = storage_service.upload_file(
            result_content, 
            storage_service.generate_upload_path(current_user.id, "result.mp4", "results"),
            "video/mp4"
        )
        
        # Update record
        face_swap.status = SwapStatus.COMPLETED
        face_swap.result_url = result_url
        face_swap.processing_time = processing_time
        current_user.use_video_quota()
        
        # Cleanup
        os.unlink(src_tmp_path)
        os.unlink(tgt_tmp_path)
        os.unlink(result_path)
        
        await db.commit()
        await db.refresh(face_swap)
        
    except Exception as e:
        face_swap.status = SwapStatus.FAILED
        face_swap.error_message = str(e)
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Video face swap failed: {str(e)}")
    
    return face_swap


@router.get("/history", response_model=FaceSwapList)
async def get_history(
    page: int = 1,
    limit: int = 20,
    swap_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's face swap history"""
    query = select(FaceSwap).where(FaceSwap.user_id == current_user.id)
    
    if swap_type:
        query = query.where(FaceSwap.swap_type == swap_type)
    
    # Get total count
    count_query = select(FaceSwap).where(FaceSwap.user_id == current_user.id)
    if swap_type:
        count_query = count_query.where(FaceSwap.swap_type == swap_type)
    
    total_result = await db.execute(count_query)
    total = len(total_result.scalars().all())
    
    # Get paginated results
    query = query.order_by(desc(FaceSwap.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return FaceSwapList(
        items=items,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )


@router.get("/{swap_id}", response_model=FaceSwapResponse)
async def get_swap(
    swap_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific face swap result"""
    result = await db.execute(
        select(FaceSwap).where(
            FaceSwap.id == swap_id,
            FaceSwap.user_id == current_user.id
        )
    )
    face_swap = result.scalar_one_or_none()
    
    if not face_swap:
        raise HTTPException(status_code=404, detail="Face swap not found")
    
    return face_swap


@router.delete("/{swap_id}", response_model=MessageResponse)
async def delete_swap(
    swap_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a face swap record"""
    result = await db.execute(
        select(FaceSwap).where(
            FaceSwap.id == swap_id,
            FaceSwap.user_id == current_user.id
        )
    )
    face_swap = result.scalar_one_or_none()
    
    if not face_swap:
        raise HTTPException(status_code=404, detail="Face swap not found")
    
    # Delete files from storage
    if face_swap.source_image_url:
        storage_service.delete_file(face_swap.source_image_url.split("/")[-1])
    if face_swap.target_image_url:
        storage_service.delete_file(face_swap.target_image_url.split("/")[-1])
    if face_swap.target_video_url:
        storage_service.delete_file(face_swap.target_video_url.split("/")[-1])
    if face_swap.result_url:
        storage_service.delete_file(face_swap.result_url.split("/")[-1])
    
    await db.delete(face_swap)
    await db.commit()
    
    return MessageResponse(message="Face swap deleted successfully")
