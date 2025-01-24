'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  DevelopmentCategory,
  DevelopmentPriority,
  DevelopmentStatus,
} from '@/types/members/development';

interface UpdateDevelopmentProjectData {
  id: string;
  title: string;
  description: string;
  category: DevelopmentCategory;
  priority: DevelopmentPriority;
  status: DevelopmentStatus;
  target_completion_date: string | null;
  budget: number | null;
  assigned_to: string | null;
}

export async function updateDevelopmentProject(
  data: UpdateDevelopmentProjectData
) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const updateData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      status: data.status,
      target_completion_date: data.target_completion_date
        ? new Date(data.target_completion_date).toISOString()
        : null,
      budget: data.budget,
      assigned_to: data.assigned_to,
    };

    // Update development initiative
    const { error: updateError } = await supabase
      .from('demo_development_initiatives')
      .update(updateData)
      .eq('id', data.id);

    if (updateError) throw updateError;

    // Fetch updated initiative data
    const { data: updatedInitiative, error: fetchError } = await supabase
      .from('demo_development_initiatives')
      .select(
        `
        *,
        created_by_user:demo_profiles!demo_development_initiatives_created_by_fkey (
          email,
          full_name
        ),
        comments:development_initiative_comments (
          *,
          user:profiles (
            email,
            full_name
          )
        ),
        assigned_to_user:demo_profiles!demo_development_initiatives_assigned_to_fkey (
          id,
          email,
          full_name
        )
      `
      )
      .eq('id', data.id)
      .single();

    if (fetchError) throw fetchError;
    if (!updatedInitiative)
      throw new Error('Failed to retrieve updated initiative data');

    revalidatePath('/members/development');
    return { data: updatedInitiative, error: null };
  } catch (error) {
    console.error('Error updating development project:', error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update development project',
    };
  }
}

export async function deleteDevelopmentProject(projectId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Delete the initiative and related data
    await supabase
      .rpc('delete_initiative', { p_initiative_id: projectId })
      .throwOnError();

    revalidatePath('/members/development');
    return { error: null };
  } catch (error) {
    console.error('Error deleting development project:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete development project',
    };
  }
}
