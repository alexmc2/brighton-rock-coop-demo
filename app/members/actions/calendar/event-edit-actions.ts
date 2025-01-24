'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CalendarEventWithDetails } from '@/types/members/calendar';

export async function getCurrentUser() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated');
  }

  return user;
}

export async function getMaintenanceRequestId(
  visitId: string
): Promise<string | null> {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('maintenance_visits')
    .select('request_id')
    .eq('id', visitId)
    .single();

  if (error || !data) {
    console.error('Error fetching maintenance request:', error);
    return null;
  }

  return data.request_id;
}

export async function getEventDetails(
  eventId: string
): Promise<CalendarEventWithDetails | null> {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('calendar_events')
    .select(
      `
      *,
      created_by_user:profiles!calendar_events_created_by_fkey(
        email,
        full_name
      ),
      last_modified_by_user:profiles!calendar_events_last_modified_by_fkey(
        email,
        full_name
      )
    `
    )
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data;
}

export async function updateEvent({
  eventId,
  title,
  description,
  startTime,
  endTime,
  userId,
}: {
  eventId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  userId: string;
}) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        created_by: userId,
        last_modified_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (error) throw error;

    revalidatePath('/members/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

export async function deleteEvent(eventId: string, referenceId: string | null) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // If this is a doodle poll event, update the poll to remove the event_id
    if (referenceId) {
      const { error: pollError } = await supabase
        .from('doodle_polls')
        .update({
          event_id: null,
          closed: true, // Keep it closed even if event is deleted
          updated_at: new Date().toISOString(),
        })
        .eq('id', referenceId);

      if (pollError) {
        console.error('Error updating poll:', pollError);
        throw pollError;
      }
    }

    // Delete the event
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    revalidatePath('/members/calendar');
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}
