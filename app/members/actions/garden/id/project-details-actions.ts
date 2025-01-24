'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  GardenProject,
  GardenProjectWithDetails,
  GardenProjectParticipationStatus,
} from '@/types/members/garden';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function getProjectDetails(id: string) {
  try {
    const { data: project, error } = await supabaseAdmin
      .from('garden_projects')
      .select(
        `
        *,
        area:garden_areas!garden_projects_area_id_fkey(
          id,
          name,
          description
        ),
        comments:garden_comments(
          *,
          user:profiles!garden_comments_user_id_fkey(
            id,
            email,
            full_name
          )
        ),
        created_by_user:profiles!garden_projects_created_by_fkey(
          id,
          email,
          full_name
        ),
        last_modified_by_user:profiles!garden_projects_last_modified_by_fkey(
          id,
          email,
          full_name
        ),
        participants:garden_project_participants(
          *,
          user:profiles(
            id,
            email,
            full_name
          )
        ),
        images:garden_images(
          id,
          public_id,
          secure_url,
          caption,
          created_at,
          uploaded_by,
          user:profiles!garden_images_uploaded_by_fkey(
            id,
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .order('created_at', { foreignTable: 'garden_comments', ascending: true })
      .order('created_at', { foreignTable: 'garden_images', ascending: false })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return project as GardenProjectWithDetails;
  } catch (err) {
    console.error('Error fetching Garden Project:', err);
    return null;
  }
}

interface GetUserAndParticipationResult {
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  participationStatus: GardenProjectParticipationStatus | null;
}

export async function getUserAndProjectParticipation(
  projectId: string
): Promise<GetUserAndParticipationResult> {
  try {
    const supabase = createServerComponentClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { user: null, participationStatus: null };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get participation status
    const { data: participation, error: participationError } = await supabase
      .from('garden_project_participants')
      .select('status')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (participationError && participationError.code !== 'PGRST116') {
      throw participationError;
    }

    return {
      user: profile,
      participationStatus: participation?.status || null,
    };
  } catch (error) {
    console.error('Error fetching user and participation:', error);
    throw new Error('Failed to fetch user data');
  }
}

interface UpdateParticipationParams {
  projectId: string;
  userId: string;
  newStatus: GardenProjectParticipationStatus | null;
}

export async function updateProjectParticipation({
  projectId,
  userId,
  newStatus,
}: UpdateParticipationParams) {
  try {
    const supabase = createServerComponentClient({ cookies });

    if (newStatus === null) {
      // Remove participation
      const { error: deleteError } = await supabase
        .from('garden_project_participants')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
    } else {
      // First delete any existing participation
      await supabase
        .from('garden_project_participants')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      // Then add new participation with timestamps
      const { error: insertError } = await supabase
        .from('garden_project_participants')
        .insert({
          project_id: projectId,
          user_id: userId,
          status: newStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    // Fetch updated project data to return
    const { data: updatedParticipants, error: fetchError } = await supabase
      .from('garden_project_participants')
      .select(
        `
        *,
        user:profiles(
          id,
          email,
          full_name
        )
      `
      )
      .eq('project_id', projectId);

    if (fetchError) throw fetchError;

    return { success: true, participants: updatedParticipants };
  } catch (error) {
    console.error('Error updating participation:', error);
    throw new Error('Failed to update participation');
  }
}

export async function getProjectParticipants(projectId: string) {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from('garden_project_participants')
    .select(
      `
      *,
      user:profiles(
        id,
        email,
        full_name
      )
    `
    )
    .eq('project_id', projectId);

  if (error) throw error;
  return data;
}
