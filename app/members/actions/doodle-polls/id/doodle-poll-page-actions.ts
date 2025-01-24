'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import type { DoodlePollWithDetails } from '@/types/members/doodle';

export async function getDoodlePollById(id: string) {
  try {
    const { data: poll, error } = await supabaseAdmin
      .from('doodle_polls')
      .select(
        `
        *,
        created_by_user:profiles!doodle_polls_created_by_fkey(
          id,
          email,
          full_name
        ),
        options:doodle_poll_options(*),
        participants:doodle_poll_participants(
          *,
          user:profiles!doodle_poll_participants_user_id_fkey(
            id,
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return poll as DoodlePollWithDetails;
  } catch (err) {
    console.error('Error fetching doodle poll:', err);
    return null;
  }
}

export async function getCurrentUserWithProfile() {
  try {
    const supabase = createServerComponentClient({ cookies });

    // First get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    // Then get their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    return {
      user,
      profile,
    };
  } catch (error) {
    console.error('Error fetching user and profile:', error);
    throw new Error('Failed to fetch user data');
  }
}
