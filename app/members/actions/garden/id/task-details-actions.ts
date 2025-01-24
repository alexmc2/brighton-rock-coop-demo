'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { GardenTaskParticipationStatus } from '@/types/members/garden';

export async function getTaskDetails(taskId: string) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: task, error } = await supabase
      .from('garden_tasks')
      .select(
        `
        *,
        area:garden_areas(id, name),
        comments:garden_comments(
          *,
          user:profiles!garden_comments_user_id_fkey(email, full_name)
        ),
        participants:garden_task_participants(
          *,
          user:profiles(email, full_name)
        ),
        created_by_user:profiles!garden_tasks_created_by_fkey(email, full_name),
        images:garden_images(
          id,
          public_id,
          secure_url,
          caption,
          created_at,
          uploaded_by,
          user:profiles!garden_images_uploaded_by_fkey(email, full_name)
        )
      `
      )
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error in getTaskDetails:', error);
      throw error;
    }

    // Debug logging
    console.log('Task details:', {
      id: task.id,
      title: task.title,
      imageCount: task.images?.length || 0,
      images: task.images,
    });

    return task;
  } catch (error) {
    console.error('Error fetching task details:', error);
    throw error;
  }
}

interface GetUserAndParticipationResult {
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  participationStatus: GardenTaskParticipationStatus | null;
}

export async function getUserAndTaskParticipation(
  taskId: string
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
      .from('garden_task_participants')
      .select('status')
      .eq('task_id', taskId)
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
  taskId: string;
  userId: string;
  newStatus: GardenTaskParticipationStatus | null;
}

export async function updateTaskParticipation({
  taskId,
  userId,
  newStatus,
}: UpdateParticipationParams) {
  try {
    const supabase = createServerComponentClient({ cookies });

    if (newStatus === null) {
      // Remove participation
      const { error: deleteError } = await supabase
        .from('garden_task_participants')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
    } else {
      // First delete any existing participation
      await supabase
        .from('garden_task_participants')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      // Then add new participation with timestamps
      const { error: insertError } = await supabase
        .from('garden_task_participants')
        .insert({
          task_id: taskId,
          user_id: userId,
          status: newStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    // Fetch updated task data to return
    const { data: updatedParticipants, error: fetchError } = await supabase
      .from('garden_task_participants')
      .select(
        `
        id,
        task_id,
        user_id,
        status,
        created_at,
        updated_at,
        user:profiles(id, email, full_name)
      `
      )
      .eq('task_id', taskId);

    if (fetchError) throw fetchError;

    return { success: true, participants: updatedParticipants };
  } catch (error) {
    console.error('Error updating participation:', error);
    throw new Error('Failed to update participation');
  }
}
