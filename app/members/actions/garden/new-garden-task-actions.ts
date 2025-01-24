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

interface CreateGardenTaskInput {
  title: string;
  description: string;
  areaId: string;
  priority: GardenTaskPriority;
  status: GardenTaskStatus;
  dueDate: string | null;
  scheduledTime: string | null;
  assignedTo: string;
  duration: string | null;
  userId: string;
}

export async function createGardenTask({
  title,
  description,
  areaId,
  priority,
  status,
  dueDate,
  scheduledTime,
  assignedTo,
  duration,
  userId,
}: CreateGardenTaskInput) {
  try {
    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('demo_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Prepare duration interval
    let durationInterval: string | null = null;
    if (duration) {
      durationInterval = `${duration} hours`;
    }

    // Insert garden task
    const { data: newTask, error: insertError } = await supabaseAdmin
      .from('demo_garden_tasks')
      .insert({
        title,
        description,
        area_id: areaId,
        priority,
        due_date: dueDate,
        scheduled_time: scheduledTime,
        assigned_to: assignedTo || 'Everyone',
        status,
        duration: durationInterval,
        created_by: userId,
        last_modified_by: userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Revalidate the garden pages
    revalidatePath('/members/garden');
    revalidatePath('/members/garden/[id]', 'page');

    return { newTask, profile };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}
