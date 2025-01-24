'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DoodleEventType } from '@/types/members/doodle';

interface CreateDoodlePollData {
  title: string;
  description: string;
  eventType: DoodleEventType;
  category: string;
  location: string;
  responseDeadline: string | null;
  options: Array<{
    date: string;
    start_time: string | null;
    duration: string | null;
  }>;
}

export async function createDoodlePoll({
  title,
  description,
  eventType,
  category,
  location,
  responseDeadline,
  options,
}: CreateDoodlePollData) {
  try {
    const supabase = createServerComponentClient({ cookies });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Create the poll
    const { data: poll, error: pollError } = await supabase
      .from('doodle_polls')
      .insert({
        title: title.trim(),
        description: description.trim(),
        event_type: eventType,
        category,
        location: location.trim() || null,
        created_by: user.id,
        closed: false,
        event_id: null,
        response_deadline: responseDeadline,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // Create all options
    const optionsToCreate = options.map((option) => ({
      poll_id: poll.id,
      date: option.date,
      start_time: option.start_time,
      duration: option.duration,
      created_at: new Date().toISOString(),
    }));

    const { error: optionsError } = await supabase
      .from('doodle_poll_options')
      .insert(optionsToCreate);

    if (optionsError) throw optionsError;

    return { success: true, poll };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create poll'
    );
  }
}
