// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinaryImages() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: process.env.CLOUDINARY_FOLDER_PREFIX || 'coop-images-demo/',
      max_results: 500,
      direction: 'desc',
      sort_by: 'created_at',
      next: {
        revalidate: 0,
      },
    });

    if (!result?.resources) {
      console.error('No resources found in Cloudinary response');
      return [];
    }

    return result.resources.map((resource: any) => {
      // Create an optimized URL with Cloudinary transformations
      const optimizedUrl = cloudinary.url(resource.public_id, {
        format: 'webp',
        quality: 'auto:best',
        transformation: [
          { width: 'auto', dpr: 'auto', fetch_format: 'auto' },
          { responsive: true, width: 800, crop: 'scale' },
        ],
        secure: true,
        version: resource.version || Date.now(),
      });

      return {
        public_id: resource.public_id,
        secure_url: optimizedUrl,
        created_at: resource.created_at,
        width: resource.width,
        height: resource.height,
        version: resource.version,
      };
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

export async function deleteCloudinaryImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}

// Helper function to generate optimized Cloudinary URLs
export function getOptimizedImageUrl(publicId: string, width: number = 800) {
  return cloudinary.url(publicId, {
    format: 'webp',
    quality: 'auto:best',
    transformation: [
      { width: 'auto', dpr: 'auto', fetch_format: 'auto' },
      { width: width, crop: 'scale' },
    ],
    secure: true,
  });
}
