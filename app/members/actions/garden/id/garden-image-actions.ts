'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  uploadGardenImage,
  deleteGardenImage,
} from '@/utils/garden-cloudinary';

export async function uploadTaskImage(formData: FormData) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const file = formData.get('file') as File | null;
    const taskId = formData.get('taskId') as string | null;
    const projectId = formData.get('projectId') as string | null;
    const caption = formData.get('caption') as string | null;

    // Debug logging
    console.log('Upload garden image params:', {
      taskId,
      projectId,
      caption,
      fileName: file?.name,
    });

    if (!file) {
      throw new Error('No file provided');
    }

    if (!taskId && !projectId) {
      throw new Error('No task or project ID provided');
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadGardenImage(file);
    if (!cloudinaryResult) {
      throw new Error('Failed to upload image');
    }

    // Debug logging
    console.log('Cloudinary upload result:', cloudinaryResult);

    // Save to database
    const { data: insertedImage, error: dbError } = await supabase
      .from('garden_images')
      .insert({
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
        task_id: taskId,
        project_id: projectId,
        uploaded_by: user.id,
        caption,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    // Debug logging
    console.log('Inserted image:', insertedImage);

    return { success: true, image: cloudinaryResult };
  } catch (error) {
    console.error('Error uploading garden image:', error);
    throw error;
  }
}

export async function deleteTaskImage(imageId: string) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get image details
    const { data: image, error: fetchError } = await supabase
      .from('garden_images')
      .select('public_id')
      .eq('id', imageId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from Cloudinary
    await deleteGardenImage(image.public_id);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('garden_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting garden image:', error);
    throw error;
  }
}

export async function getResourceImages(resourceId: string, isProject = false) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: images, error } = await supabase
      .from('garden_images')
      .select(
        `
        id,
        public_id,
        secure_url,
        caption,
        created_at,
        uploaded_by,
        user:profiles(email, full_name)
      `
      )
      .eq(isProject ? 'project_id' : 'task_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return images;
  } catch (error) {
    console.error('Error fetching resource images:', error);
    throw error;
  }
}
