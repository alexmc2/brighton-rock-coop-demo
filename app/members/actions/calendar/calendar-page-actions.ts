// app/members/actions/calendar/calendar-page-actions.ts
'use server';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CalendarEventWithDetails } from '@/types/members/calendar';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

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

export async function createCalendarEvent(
  title: string,
  description: string | null,
  startTime: Date,
  endTime: Date,
  eventType:
    | 'manual'
    | 'garden_task'
    | 'development_event'
    | 'social_event'
    | 'maintenance_visit' = 'manual',
  userId: string,
  fullName?: string | null,
  referenceId?: string,
  subcategory?: string
) {
  // Delete any existing events for this reference if it's a garden task or development event
  if (referenceId) {
    await supabaseAdmin
      .from('demo_calendar_events')
      .delete()
      .eq('reference_id', referenceId)
      .eq('event_type', eventType);
  }
  const { data, error } = await supabaseAdmin
    .from('demo_calendar_events')
    .insert({
      title,
      description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: eventType,
      created_by: userId,
      full_name: fullName,
      reference_id: referenceId,
      category:
        eventType === 'garden_task'
          ? 'Garden'
          : eventType === 'development_event'
          ? 'Development Event'
          : eventType === 'maintenance_visit'
          ? 'P4P Visit'
          : eventType === 'social_event'
          ? 'Co-op Social'
          : 'Miscellaneous',
      subcategory: subcategory,
    })
    .select()
    .single();

  if (error) {
    console.error('Calendar event creation error:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }

  return data;
}

export async function createGardenTaskEvent(
  title: string,
  description: string,
  dueDate: string,
  scheduledTime: string | null,
  duration: string | null,
  userId: string,
  fullName: string | null,
  taskId: string
) {
  // Create a Date object for the due date
  const date = new Date(dueDate);

  // If there's a scheduled time, parse and set it
  if (scheduledTime) {
    const [hours, minutes] = scheduledTime.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  } else {
    // Default to 9 AM if no time specified
    date.setHours(9, 0);
  }

  // Calculate end time based on duration
  const durationMs = parseDuration(duration);

  // End time is start time plus duration
  const endTime = new Date(date.getTime() + durationMs);

  // Create single calendar event
  return createCalendarEvent(
    title,
    description,
    date,
    endTime,
    'garden_task',
    userId,
    fullName,
    taskId
  );
}

function parseDuration(durationStr: string | null): number {
  if (!durationStr) {
    return 60 * 60 * 1000; // Default to 1 hour in milliseconds
  }
  const duration = parseFloat(durationStr);
  if (isNaN(duration)) {
    return 60 * 60 * 1000; // Default to 1 hour
  }
  if (duration === 24) {
    return 24 * 60 * 60 * 1000; // All day
  }
  return duration * 60 * 60 * 1000; // Convert hours to milliseconds
}

export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventWithDetails>,
  userId: string
) {
  const { data, error } = await supabaseAdmin
    .from('demo_calendar_events')
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
  const { error } = await supabaseAdmin
    .from('demo_calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

export async function createMaintenanceVisitEventServer(
  visitId: string,
  title: string,
  description: string,
  scheduledDate: string,
  estimatedDuration: string,
  userId: string,
  fullName: string | null
) {
  // Delete any existing events for this visit using admin client
  await supabaseAdmin
    .from('demo_calendar_events')
    .delete()
    .eq('reference_id', visitId)
    .eq('event_type', 'maintenance_visit');

  // Calculate end time based on duration
  const startTime = new Date(scheduledDate);
  const durationHours = parseInt(estimatedDuration.split(' ')[0]);
  const endTime = new Date(
    startTime.getTime() + durationHours * 60 * 60 * 1000
  );

  // Create the calendar event using admin client
  const { data, error } = await supabaseAdmin
    .from('demo_calendar_events')
    .insert({
      title,
      description: description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      event_type: 'maintenance_visit',
      reference_id: visitId,
      category: 'P4P Visit',
      created_by: userId,
      full_name: fullName,
    })
    .select()
    .single();

  if (error) {
    console.error('Calendar event creation error:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }

  return data;
}

export async function createDevelopmentEvent(
  title: string,
  description: string,
  eventDate: string,
  startTime: string | null,
  duration: string | null,
  userId: string,
  fullName: string | null,
  initiativeId: string
) {
  // Create a Date object for the event date
  const date = new Date(eventDate);

  // If there's a scheduled time, parse and set it
  if (startTime) {
    const [hours, minutes] = startTime.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  } else {
    // Default to 9 AM if no time specified
    date.setHours(9, 0);
  }

  // Calculate end time based on duration
  const durationMs = parseDuration(duration);

  // End time is start time plus duration
  const endTime = new Date(date.getTime() + durationMs);

  // Create single calendar event
  return createCalendarEvent(
    title,
    description,
    date,
    endTime,
    'development_event',
    userId,
    fullName,
    initiativeId
  );
}

// lib/actions/calendar.ts

export async function createSocialEventCalendarEvent(
  title: string,
  description: string,
  eventDate: string,
  startTime: string | null,
  duration: string | null,
  userId: string,
  fullName: string | null,
  eventId: string,
  category: string
) {
  // Create a Date object for the event date
  const date = new Date(eventDate);

  // If there's a scheduled time, parse and set it
  if (startTime) {
    const [hours, minutes] = startTime.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  } else {
    // Default to 7 PM if no time specified
    date.setHours(19, 0);
  }

  // Calculate end time based on duration
  const durationMs = parseDuration(duration);

  // End time is start time plus duration
  const endTime = new Date(date.getTime() + durationMs);

  // Delete any existing events for this social event
  if (eventId) {
    await supabaseAdmin
      .from('demo_calendar_events')
      .delete()
      .eq('reference_id', eventId)
      .eq('event_type', 'social_event');
  }

  // Create calendar event directly to ensure correct category and subcategory
  const { data, error } = await supabaseAdmin
    .from('demo_calendar_events')
    .insert({
      title,
      description,
      start_time: date.toISOString(),
      end_time: endTime.toISOString(),
      event_type: 'social_event',
      created_by: userId,
      full_name: fullName,
      reference_id: eventId,
      category: 'Co-op Social',
      subcategory: category,
    })
    .select()
    .single();

  if (error) {
    console.error('Calendar event creation error:', error);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }

  return data;
}
