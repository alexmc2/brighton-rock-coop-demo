'use server';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CalendarEventWithDetails } from '@/types/members/calendar';

export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventWithDetails>,
  userId: string
) {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...updates, last_modified_by: userId })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }

  return data;
}

export async function deleteCalendarEvent(eventId: string) {
  const supabase = createClientComponentClient();

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}
