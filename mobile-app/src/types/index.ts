// Types for API responses

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_verified: boolean;
  video_quota: number;
  image_quota: number;
  videos_used: number;
  images_used: number;
  created_at: string;
}

export interface FaceSwapItem {
  id: number;
  user_id: number;
  swap_type: string;
  status: string;
  source_image_url: string | null;
  target_image_url: string | null;
  target_video_url: string | null;
  result_url: string | null;
  processing_time: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface HistoryResponse {
  items: FaceSwapItem[];
  total: number;
  page: number;
  pages: number;
}
