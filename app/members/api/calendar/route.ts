import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarIcal } from '@/app/members/actions/calendar/ical-actions';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    const providedKey = request.nextUrl.searchParams.get('key');

    try {
      const calendarContent = await generateCalendarIcal(providedKey || '');

      return new NextResponse(calendarContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="brighton-rock-calendar.ics"',
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
