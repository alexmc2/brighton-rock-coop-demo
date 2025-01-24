'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { DoodlePoll } from '@/types/members/doodle';

export async function getDoodlePolls() {
  try {
    const supabase = createServerComponentClient({ cookies });

    const { data: polls, error } = await supabase
      .from('doodle_polls')
      .select(
        `
        *,
        created_by_user:profiles!doodle_polls_created_by_fkey(email, full_name),
        options:doodle_poll_options(*),
        participants:doodle_poll_participants(
          *,
          user:profiles!doodle_poll_participants_user_id_fkey(email, full_name)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (polls as DoodlePoll[]) || [];
  } catch (error) {
    console.error('Error fetching doodle polls:', error);
    throw new Error('Failed to fetch doodle polls');
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw new Error('Failed to fetch current user');
  }
}
