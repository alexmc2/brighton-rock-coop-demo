'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  TodoStatus,
  TodoCategory,
  TodoPriority,
  TodoWithDetails,
} from '@/types/members/todos';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function getTodo(id: string) {
  try {
    const { data: todo, error } = await supabaseAdmin
      .from('demo_todos')
      .select(
        `
        *,
        created_by_user:demo_profiles!demo_todos_created_by_fkey(email, full_name),
        assigned_to_user:demo_profiles!demo_todos_assigned_to_fkey(email, full_name),
        last_modified_by_user:demo_profiles!demo_todos_last_modified_by_fkey(email, full_name),
        comments:demo_todo_comments(
          *,
          user:demo_profiles!demo_todo_comments_created_by_fkey(
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .order('created_at', { foreignTable: 'todo_comments', ascending: true })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, data: null, error: 'Todo not found' };
      }
      throw error;
    }

    return { success: true, data: todo as TodoWithDetails, error: null };
  } catch (err) {
    console.error('Error fetching todo:', err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch todo',
    };
  }
}

interface UpdateTodoData {
  id: string;
  title: string;
  description: string;
  todoType: TodoCategory;
  status: TodoStatus;
  priority: TodoPriority;
  assignedTo: string | null;
}

export async function updateTodo(data: UpdateTodoData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Get Current User
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    // Update Todo in Supabase
    const { data: updatedTodo, error: updateError } = await supabase
      .from('demo_todos')
      .update({
        title: data.title.trim(),
        description: data.description.trim() || null,
        todo_type: data.todoType,
        status: data.status,
        priority: data.priority,
        assigned_to: data.assignedTo || null,
        last_modified_by: user.id,
      })
      .eq('id', data.id)
      .select(
        `
        *,
        created_by_user:demo_profiles!demo_todos_created_by_fkey(
          email,
          full_name
        ),
        assigned_to_user:demo_profiles!demo_todos_assigned_to_fkey(
          email,
          full_name
        ),
        last_modified_by_user:demo_profiles!demo_todos_last_modified_by_fkey(
          email,
          full_name
        )
      `
      )
      .single();

    if (updateError) throw updateError;

    revalidatePath('/members/todos');
    revalidatePath(`/members/todos/${data.id}`);

    return { success: true, data: updatedTodo, error: null };
  } catch (error) {
    console.error('Error updating todo:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update todo',
    };
  }
}

export async function deleteTodo(id: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Delete todo (comments will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('demo_todos')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    revalidatePath('/members/todos');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting todo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete todo',
    };
  }
}
