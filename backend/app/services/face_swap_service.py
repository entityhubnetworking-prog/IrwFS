"""
Face Swap Service using InsightFace and ONNX Runtime
"""
import os
import time
import numpy as np
from typing import Optional, Tuple
import cv2
from PIL import Image
import onnxruntime as ort

from app.core.config import settings


class FaceSwapService:
    def __init__(self):
        self.use_gpu = settings.USE_GPU
        self.provider = settings.ONNX_PROVIDER if self.use_gpu else "CPUExecutionProvider"
        self.model_path = os.path.join(os.path.dirname(__file__), "..", "..", "models")
        
        # Initialize ONNX sessions
        self.face_detector = None
        self.face_recognizer = None
        self.face_swap_model = None
        
        self._load_models()
    
    def _load_models(self):
        """Load ONNX models for face detection and swapping"""
        providers = [self.provider]
        
        # Check if CUDA is available
        if self.use_gpu and "CUDAExecutionProvider" in ort.get_available_providers():
            print(f"Using GPU acceleration with {self.provider}")
        else:
            print("Using CPU for inference")
            providers = ["CPUExecutionProvider"]
        
        # Models would be loaded here
        # For now, we'll initialize them when needed
        print("Face swap models initialized (placeholder)")
    
    def detect_faces(self, image: np.ndarray) -> list:
        """Detect faces in an image"""
        # Placeholder - would use InsightFace for actual detection
        # Returns list of face bounding boxes and landmarks
        return []
    
    def get_face_embedding(self, image: np.ndarray, face_box: list) -> np.ndarray:
        """Get face embedding for comparison"""
        # Placeholder - would use InsightFace ArcFace model
        return np.zeros(512)
    
    def swap_face(
        self, 
        source_image: np.ndarray, 
        target_image: np.ndarray,
        source_face_idx: int = 0,
        target_face_idx: int = 0
    ) -> Tuple[np.ndarray, float]:
        """
        Perform face swap from source to target
        Returns: (result_image, processing_time)
        """
        start_time = time.time()
        
        # Detect faces
        source_faces = self.detect_faces(source_image)
        target_faces = self.detect_faces(target_image)
        
        if not source_faces:
            raise ValueError("No face detected in source image")
        if not target_faces:
            raise ValueError("No face detected in target image")
        
        # Perform face swap
        # This is a placeholder - actual implementation would use
        # InsightFace's face swapping model
        
        # For demo, just return the target image
        result = target_image.copy()
        
        processing_time = time.time() - start_time
        return result, processing_time
    
    def swap_face_video(
        self,
        source_image: np.ndarray,
        target_video_path: str,
        output_path: str
    ) -> Tuple[str, float]:
        """
        Perform face swap on video
        Returns: (output_path, processing_time)
        """
        start_time = time.time()
        
        # Open video
        cap = cv2.VideoCapture(target_video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {target_video_path}")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Setup output video
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Swap face in frame
            try:
                result_frame, _ = self.swap_face(source_image, frame)
                out.write(result_frame)
            except Exception as e:
                # If no face detected, keep original frame
                out.write(frame)
            
            frame_count += 1
        
        cap.release()
        out.release()
        
        processing_time = time.time() - start_time
        return output_path, processing_time
    
    def image_to_numpy(self, image_path: str) -> np.ndarray:
        """Load image as numpy array"""
        img = Image.open(image_path)
        return np.array(img)
    
    def numpy_to_image(self, array: np.ndarray, output_path: str):
        """Save numpy array as image"""
        img = Image.fromarray(array)
        img.save(output_path)


# Singleton instance
face_swap_service = None


def get_face_swap_service() -> FaceSwapService:
    """Get or create face swap service instance"""
    global face_swap_service
    if face_swap_service is None:
        face_swap_service = FaceSwapService()
    return face_swap_service
