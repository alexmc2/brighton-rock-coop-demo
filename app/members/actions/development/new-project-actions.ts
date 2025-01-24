'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  DevelopmentCategory,
  DevelopmentPriority,
} from '@/types/members/development';

interface CreateDevelopmentProjectData {
  title: string;
  description: string;
  category: DevelopmentCategory;
  priority: DevelopmentPriority;
  budget?: string;
}

export async function createDevelopmentProject(
  data: CreateDevelopmentProjectData
) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const projectData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      initiative_type: 'project' as const,
      created_by: user.id,
      budget: data.budget ? parseFloat(data.budget) : null,
    };

    const { error: insertError } = await supabase
      .from('development_initiatives')
      .insert(projectData);

    if (insertError) throw insertError;

    revalidatePath('/members/development');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}
