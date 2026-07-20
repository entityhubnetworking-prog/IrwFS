"""
Tencent Cloud Storage Service using cos-python-sdk-v5
"""
import os
import hashlib
from datetime import datetime
from typing import Optional
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.secret_id = settings.TENCENT_SECRET_ID
        self.secret_key = settings.TENCENT_SECRET_KEY
        self.bucket = settings.TENCENT_BUCKET
        self.region = settings.TENCENT_REGION
        self.client = None
        
        if self.secret_id and self.secret_key and self.bucket:
            try:
                config = CosConfig(
                    Region=self.region,
                    SecretId=self.secret_id,
                    SecretKey=self.secret_key
                )
                self.client = CosS3Client(config)
                print(f"✅ Tencent Cloud Storage initialized: {self.bucket}")
            except Exception as e:
                print(f"❌ Failed to initialize Tencent Cloud: {e}")
                self.client = None
        else:
            print("[DEV] Tencent Cloud Storage not configured, using local storage")
    
    def upload_file(
        self, 
        file_content: bytes, 
        file_path: str, 
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """Upload a file to Tencent Cloud Storage"""
        if not self.client:
            return self._save_local(file_content, file_path)
        
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Body=file_content,
                Key=file_path,
                ContentType=content_type
            )
            return f"https://{self.bucket}.cos.{self.region}.myqcloud.com/{file_path}"
        except Exception as e:
            print(f"Failed to upload file: {e}")
            return self._save_local(file_content, file_path)
    
    def _save_local(self, file_content: bytes, file_path: str) -> str:
        """Save file locally as fallback"""
        local_path = os.path.join("/tmp/irwfs_uploads", file_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        with open(local_path, "wb") as f:
            f.write(file_content)
        
        return f"/uploads/{file_path}"
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage"""
        if not self.client:
            local_path = os.path.join("/tmp/irwfs_uploads", file_path)
            if os.path.exists(local_path):
                os.remove(local_path)
            return True
        
        try:
            self.client.delete_object(
                Bucket=self.bucket,
                Key=file_path
            )
            return True
        except Exception as e:
            print(f"Failed to delete file: {e}")
            return False
    
    def generate_upload_path(self, user_id: int, filename: str, folder: str = "images") -> str:
        """Generate a unique file path for upload"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(f"{user_id}_{filename}_{timestamp}".encode()).hexdigest()[:8]
        ext = os.path.splitext(filename)[1]
        return f"{folder}/{user_id}/{timestamp}_{file_hash}{ext}"


storage_service = StorageService()
