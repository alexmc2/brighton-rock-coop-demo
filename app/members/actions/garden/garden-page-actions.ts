'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  GardenAreaWithDetails,
  GardenProjectWithDetails,
} from '@/types/members/garden';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { GardenProject, GardenTask } from '@/types/members/garden';

export async function getGardenTasks() {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: tasks, error } = await supabase
      .from('demo_garden_tasks')
      .select(
        `
        *,
        area:demo_garden_areas(id, name),
        comments:demo_garden_comments(*),
        participants:demo_garden_task_participants(
          *,
          user:demo_profiles(email, full_name)
        ),
        created_by_user:demo_profiles!demo_garden_tasks_created_by_fkey(email, full_name),
        images:demo_garden_images(
          id,
          public_id,
          secure_url,
          caption,
          created_at,
          uploaded_by,
          user:demo_profiles!demo_garden_images_uploaded_by_fkey(email, full_name)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    return tasks;
  } catch (error) {
    console.error('Error fetching garden tasks:', error);
    throw error;
  }
}

export async function getGardenProjects() {
  const supabase = createServerComponentClient({ cookies });

  const { data: projects, error } = await supabase
    .from('demo_garden_projects')
    .select(
      `
      *,
      area:demo_garden_areas(
        id,
        name,
        description
      ),
      images:demo_garden_images(
        id,
        public_id,
        secure_url,
        caption,
        created_at
      ),
      comments:demo_garden_comments(id),
      participants:demo_garden_project_participants(
        *,
        user:demo_profiles(
          id,
          email,
          full_name
        )
      ),
      created_by_user:demo_profiles!demo_garden_projects_created_by_fkey(
        id,
        email,
        full_name
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching garden projects:', error);
    return [];
  }

  return projects as GardenProjectWithDetails[];
}

export async function getGardenAreas(): Promise<GardenAreaWithDetails[]> {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: areas, error } = await supabase
      .from('demo_garden_areas')
      .select(
        `
        *,
        tasks:demo_garden_tasks(
          *,
          comments:demo_garden_comments(*),
          participants:demo_garden_task_participants(
            *,
            user:demo_profiles(email, full_name)
          )
        )
      `
      )
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return areas as GardenAreaWithDetails[];
  } catch (error) {
    console.error('Error fetching garden areas:', error);
    throw error;
  }
}

export async function updateGardenAreaStatus(
  areaId: string,
  status: string,
  userId: string
) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from('demo_garden_areas')
    .update({
      status,
      last_modified_by: userId,
      last_modified_at: new Date().toISOString(),
    })
    .eq('id', areaId);

  if (error) {
    throw new Error(`Failed to update garden area status: ${error.message}`);
  }
}
