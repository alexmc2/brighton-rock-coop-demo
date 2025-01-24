'use server';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GardenTaskPriority, GardenTaskStatus } from '@/types/members/garden';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function getGardenAreas() {
  const { data, error } = await supabaseAdmin
    .from('demo_garden_areas')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error fetching areas:', error);
    throw new Error('Failed to fetch garden areas');
  }

  return data || [];
}

interface UpdateGardenTaskInput {
  taskId: string;
  title: string;
  description: string;
  areaId: string;
  priority: GardenTaskPriority;
  dueDate: string | null;
  scheduledTime: string | null;
  assignedTo: string;
  status: GardenTaskStatus;
  duration: string | null;
  userId: string;
}

export async function updateGardenTask({
  taskId,
  title,
  description,
  areaId,
  priority,
  dueDate,
  scheduledTime,
  assignedTo,
  status,
  duration,
  userId,
}: UpdateGardenTaskInput) {
  try {
    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('demo_profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Prepare duration interval
    let durationInterval: string | null = null;
    if (duration) {
      const hours = parseFloat(duration);
      durationInterval = hours.toString() + ' hours';
    }

    // Update garden task
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('demo_garden_tasks')
      .update({
        title,
        description,
        area_id: areaId,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        scheduled_time: scheduledTime || null,
        assigned_to: assignedTo || 'Everyone',
        status,
        duration: durationInterval,
        last_modified_by: userId,
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    revalidatePath('/members/garden');
    revalidatePath('/members/garden/[id]', 'page');

    return { updatedTask, profile };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteGardenTask(taskId: string) {
  try {
    // First delete all comments
    const { error: commentsError } = await supabaseAdmin
      .from('demo_garden_comments')
      .delete()
      .eq('task_id', taskId);

    if (commentsError) throw commentsError;

    // Then delete the task
    const { error: deleteError } = await supabaseAdmin
      .from('demo_garden_tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) throw deleteError;

    revalidatePath('/members/garden');
    revalidatePath('/members/garden/[id]', 'page');
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}
