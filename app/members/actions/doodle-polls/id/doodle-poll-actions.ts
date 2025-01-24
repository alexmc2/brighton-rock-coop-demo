'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DoodleEventType, DoodlePollOption } from '@/types/members/doodle';

interface UpdateDoodlePollData {
  id: string;
  title: string;
  description: string;
  event_type: DoodleEventType;
  category: string;
  location: string | null;
  response_deadline: string | null;
  options: DoodlePollOption[];
}

export async function updateDoodlePoll(data: UpdateDoodlePollData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if poll is closed
    const { data: pollData, error: pollError } = await supabase
      .from('doodle_polls')
      .select('closed')
      .eq('id', data.id)
      .single();

    if (pollError) throw pollError;
    if (pollData.closed)
      throw new Error("This poll is closed and can't be edited");

    const updateData = {
      title: data.title.trim(),
      description: data.description.trim(),
      event_type: data.event_type,
      category: data.category,
      location: data.location?.trim() || null,
      response_deadline: data.response_deadline,
      updated_at: new Date().toISOString(),
    };

    // Format options to match database expectations
    const formattedOptions = data.options.map((opt) => ({
      id: opt.id.startsWith('temp-') ? null : opt.id,
      date: new Date(opt.date).toISOString().split('T')[0],
      start_time: opt.start_time,
      duration: opt.duration
        ? `${opt.duration} ${parseFloat(opt.duration) === 1 ? 'hour' : 'hours'}`
        : null,
    }));

    // Call the update function
    const { error: updateError } = await supabase.rpc('update_doodle_poll', {
      p_poll_id: data.id,
      p_poll_data: updateData,
      p_options: formattedOptions,
    });

    if (updateError) throw updateError;

    // Fetch the updated poll with all relations
    const { data: updatedPoll, error: fetchError } = await supabase
      .from('doodle_polls')
      .select(
        `
        *,
        created_by_user:profiles!doodle_polls_created_by_fkey(email, full_name),
        options:doodle_poll_options(*),
        participants:doodle_poll_participants(
          *,
          user:profiles(email, full_name)
        )
      `
      )
      .eq('id', data.id)
      .single();

    if (fetchError) throw fetchError;
    if (!updatedPoll) throw new Error('Failed to retrieve updated poll data');

    revalidatePath('/members/doodle-polls');
    return { data: updatedPoll, error: null };
  } catch (error) {
    console.error('Error updating doodle poll:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to update doodle poll',
    };
  }
}

export async function deleteDoodlePoll(pollId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Delete the poll and all related data
    const { error: deleteError } = await supabase
      .from('doodle_polls')
      .delete()
      .eq('id', pollId);

    if (deleteError) throw deleteError;

    revalidatePath('/members/doodle-polls');
    return { error: null };
  } catch (error) {
    console.error('Error deleting doodle poll:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to delete doodle poll',
    };
  }
}
