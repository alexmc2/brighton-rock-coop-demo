import { v2 as cloudinary } from 'cloudinary';

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  created_at: string;
  width: number;
  height: number;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getGardenImages() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'garden-images/', // Separate folder for garden images
      max_results: 500,
      direction: 'desc',
      sort_by: 'created_at',
    });

    return result.resources.map((resource: any) => {
      const optimizedUrl = cloudinary.url(resource.public_id, {
        format: 'webp',
        quality: 'auto:best',
        transformation: [
          { width: 'auto', dpr: 'auto', fetch_format: 'auto' },
          { responsive: true, width: 800, crop: 'scale' },
        ],
        secure: true,
      });

      return {
        public_id: resource.public_id,
        secure_url: optimizedUrl,
        created_at: resource.created_at,
        width: resource.width,
        height: resource.height,
      };
    });
  } catch (error) {
    console.error('Error fetching garden images:', error);
    return [];
  }
}

export async function deleteGardenImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting garden image:', error);
    return false;
  }
}

export async function uploadGardenImage(
  file: File
): Promise<CloudinaryUploadResult> {
  try {
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

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'garden-images',
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
            resolve({
              public_id: result!.public_id,
              secure_url: result!.secure_url,
              created_at: new Date().toISOString(),
              width: result!.width,
              height: result!.height,
            });
          }
        }
      );

      uploadStream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(new Error('Failed to process image upload'));
      });

      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Upload failed');
  }
}

// Helper function to generate optimized garden image URLs
export function getOptimizedGardenImageUrl(
  publicId: string,
  width: number = 800
) {
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
