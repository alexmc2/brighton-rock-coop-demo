'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { GardenProjectStatus } from '@/types/members/garden';
import {
  uploadGardenImage,
  deleteGardenImage,
} from '@/utils/garden-cloudinary';

interface UpdateProjectParams {
  projectId: string;
  title: string;
  description: string;
  status: GardenProjectStatus;
  areaId: string | null;
  userId: string;
  newImageData?: {
    public_id: string;
    secure_url: string;
  } | null;
}

export async function updateProject({
  projectId,
  title,
  description,
  status,
  areaId,
  userId,
  newImageData,
}: UpdateProjectParams) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // First get the current project to check if we need to delete an old image
    const { data: currentProject } = await supabase
      .from('demo_garden_projects')
      .select('main_image_public_id')
      .eq('id', projectId)
      .single();

    // If we have new image data and there's an old image, delete it
    if (newImageData && currentProject?.main_image_public_id) {
      await deleteGardenImage(currentProject.main_image_public_id);
    }

    // Update the project
    const { data: project, error: updateError } = await supabase
      .from('demo_garden_projects')
      .update({
        title,
        description,
        status,
        area_id: areaId,
        last_modified_by: userId,
        ...(newImageData && {
          main_image_public_id: newImageData.public_id,
          main_image_secure_url: newImageData.secure_url,
        }),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) throw updateError;

    return project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(projectId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // First get the project to get the main image public_id if it exists
    const { data: project } = await supabase
      .from('demo_garden_projects')
      .select('main_image_public_id')
      .eq('id', projectId)
      .single();

    // Delete the main image from Cloudinary if it exists
    if (project?.main_image_public_id) {
      await deleteGardenImage(project.main_image_public_id);
    }

    // Delete the project (this will cascade delete gallery images)
    const { error: deleteError } = await supabase
      .from('demo_garden_projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}
