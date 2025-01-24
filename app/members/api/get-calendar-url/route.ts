// app/api/get-calendar-url/route.ts
import { NextResponse } from 'next/server';
import { getCalendarUrl } from '@/app/members/actions/calendar/ical-actions';

export async function GET() {
  const url = await getCalendarUrl();
  return NextResponse.json({ url });
}
