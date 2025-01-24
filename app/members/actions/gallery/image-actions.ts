'use server';

import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryImages, deleteCloudinaryImage } from '@/utils/cloudinary';
import { CloudinaryImage } from '@/types/gallery';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getImages() {
  try {
    const images = await getCloudinaryImages();
    return images.map((image: CloudinaryImage) => ({
      ...image,
      uploaded_at: image.created_at, // Ensure we have the upload timestamp
    }));
  } catch (error) {
    console.error('Error fetching images:', error);
    throw new Error('Failed to fetch images');
  }
}

export async function deleteImage(publicId: string) {
  try {
    if (!publicId) {
      throw new Error('No public_id provided');
    }
    return await deleteCloudinaryImage(publicId);
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete image');
  }
}

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (e.g., 10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new Error('File size must be less than 10MB');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'coop-images',
          resource_type: 'auto',
          format: 'webp',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            { width: 'auto', crop: 'scale' },
            { quality: 'auto:best' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error('Failed to upload image to cloud storage'));
          } else {
            // Add upload timestamp to result
            resolve({
              ...result,
              uploaded_at: new Date().toISOString(),
            });
          }
        }
      );

      // Handle stream errors
      uploadStream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(new Error('Failed to process image upload'));
      });

      uploadStream.end(buffer);
    });

    return result;
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Upload failed');
  }
}
