import { TodoWithDetails } from '@/types/members/todos';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function getTodos(): Promise<TodoWithDetails[]> {
  try {
    const { data: todos, error } = await supabaseAdmin
      .from('todos')
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
        ),
        comments:todo_comments(
          id,
          content,
          created_at,
          created_by,
          user:profiles!todo_comments_created_by_fkey(
            email,
            full_name
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching todos:', error);
      return [];
    }

    return todos as TodoWithDetails[];
  } catch (err) {
    console.error('Error fetching todos:', err);
    return [];
  }
}
