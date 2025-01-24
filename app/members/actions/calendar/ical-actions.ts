'use server';

import ical from 'ical-generator';
import { createClient } from '@supabase/supabase-js';

// Simple function to format the title
function formatEventTitle(event: any) {
  const prefix = 'Co-op';

  switch (event.event_type) {
    case 'social_event':
      return `${prefix} Social: ${event.title}`;
    case 'garden_task':
      return `${prefix} Garden: ${event.title}`;
    case 'development_event':
      return `${prefix} Development: ${event.title}`;
    case 'maintenance_visit':
      return `${prefix} Maintenance Visit: ${event.title}`;
    case 'manual':
      return `${prefix} ${event.category}: ${event.title}`;
    default:
      return `${prefix} ${event.category || 'Event'}: ${event.title}`;
  }
}

export async function generateCalendarIcal(secretKey: string) {
  if (!secretKey || secretKey !== process.env.SECRET_CALENDAR_KEY) {
    throw new Error('Unauthorized');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    }
  );

  const { data: events, error } = await supabase
    .from('demo_calendar_events')
    .select(
      `id, title, description, start_time, end_time, event_type, category`
    )
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error('Error fetching events');
  }

  const calendar = ical({
    name: 'Brighton Rock Co-op Calendar',
    timezone: 'Europe/London',
    prodId: { company: 'brighton-rock', product: 'calendar' },
    url:
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://brighton-rock-coop-demo.vercel.app',
  });

  events?.forEach((event) => {
    try {
      calendar.createEvent({
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        summary: formatEventTitle(event),
        description: event.description || '',
        uid: event.id,
        categories: [{ name: event.category }],
      });
    } catch (eventError) {
      console.error('Error creating event:', event.title, eventError);
    }
  });

  return calendar.toString();
}

export async function getCalendarUrl() {
  return `https://brighton-rock-coop-demo.vercel.app/members/api/calendar?key=${process.env.SECRET_CALENDAR_KEY}`;
}
