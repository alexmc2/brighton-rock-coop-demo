export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  created_at: string;
  width?: number;
  height?: number;
  uploaded_at?: string; // ISO timestamp from Cloudinary
}
