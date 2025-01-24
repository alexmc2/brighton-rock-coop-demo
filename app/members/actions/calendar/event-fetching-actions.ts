'use server';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CalendarEventWithDetails } from '@/types/members/calendar';

export async function getCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEventWithDetails[]> {
  const supabase = createClientComponentClient();

  const { data: events, error } = await supabase
    .from('demo_calendar_events')
    .select(
      `
      *,
      created_by_user:created_by(email, full_name),
      last_modified_by_user:last_modified_by(email, full_name),
      category
    `
    )
    .gte('start_time', startDate.toISOString())
    .lte('end_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }

  // Assign 'Miscellaneous' to events without a category
  return (events || []).map((event) => ({
    ...event,
    category: event.category || 'Miscellaneous',
  }));
}
