'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

interface CreateTodoData {
  title: string;
  description: string;
  todoType: 'general' | 'minuted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string | null;
}

export async function fetchProfiles() {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch profiles',
    };
  }
}

export async function createTodo(data: CreateTodoData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Get Current User
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    // Insert Todo into Supabase
    const { data: newTodo, error: insertError } = await supabase
      .from('todos')
      .insert({
        title: data.title.trim(),
        description: data.description.trim() || null,
        todo_type: data.todoType,
        status: 'pending',
        priority: data.priority,
        created_by: user.id,
        last_modified_by: user.id,
        assigned_to: data.assignedTo || null,
      })
      .select(
        `
        *,
        created_by_user:profiles!todos_created_by_fkey(
          email,
          full_name
        ),
        assigned_to_user:profiles!todos_assigned_to_fkey(
          email,
          full_name
        ),
        last_modified_by_user:profiles!todos_last_modified_by_fkey(
          email,
          full_name
        )
      `
      )
      .single();

    if (insertError) throw insertError;

    // Revalidate the todos page
    revalidatePath('/members/todos');

    return { success: true, data: newTodo, error: null };
  } catch (error) {
    console.error('Error creating todo:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create todo',
    };
  }
}
