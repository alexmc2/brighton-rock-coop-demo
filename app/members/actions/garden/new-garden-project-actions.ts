'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { uploadGardenImage } from '@/utils/garden-cloudinary';

export async function createNewProject(formData: FormData) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const areaId = formData.get('area_id') as string;
    const file = formData.get('project_image') as File | null;

    let mainImagePublicId = null;
    let mainImageSecureUrl = null;

    // Upload main image if provided
    if (file) {
      const cloudinaryResult = await uploadGardenImage(file);
      if (cloudinaryResult) {
        mainImagePublicId = cloudinaryResult.public_id;
        mainImageSecureUrl = cloudinaryResult.secure_url;
      }
    }

    // Create project
    const { data: project, error: insertError } = await supabase
      .from('demo_garden_projects')
      .insert({
        title,
        description,
        area_id: areaId || null,
        status: 'active',
        created_by: user.id,
        last_modified_by: user.id,
        main_image_public_id: mainImagePublicId,
        main_image_secure_url: mainImageSecureUrl,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return { success: true, project };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}
