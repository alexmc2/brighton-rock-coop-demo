'use server';

import { GardenTaskWithDetails } from '@/types/members/garden';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function getGardenTask(id: string) {
  try {
    const { data: task, error } = await supabaseAdmin
      .from('garden_tasks')
      .select(
        `
        *,
        area:garden_areas!garden_tasks_area_id_fkey(
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
        created_by_user:profiles!garden_tasks_created_by_fkey(
            id,
            email,
            full_name
        )
      `
      )
      .eq('id', id)
      .order('created_at', { foreignTable: 'garden_comments', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return task as GardenTaskWithDetails;
  } catch (err) {
    console.error('Error fetching Garden Task:', err);
    return null;
  }
}
