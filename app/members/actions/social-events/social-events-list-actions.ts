'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SocialEventWithDetails } from '@/types/members/social';

export async function getSocialEventParticipants(eventId: string) {
  const supabase = createServerComponentClient({ cookies });

  const { data: participants, error } = await supabase
    .from('demo_social_event_participants')
    .select(
      `
      *,
      user:demo_profiles(
        id,
        email,
        full_name
      )
    `
    )
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching social event participants:', error);
    throw error;
  }

  return participants;
}

export async function getSocialEvents() {
  const supabase = createServerComponentClient({ cookies });

  const { data: events, error } = await supabase.from('demo_social_events').select(`
      *,
      organizer:profiles!demo_social_events_organizer_id_fkey(
        id,
        email,
        full_name
      ),
      participants:demo_social_event_participants(
        *,
        user:demo_profiles(
          id,
          email,
          full_name
        )
      )
    `);

  if (error) {
    console.error('Error fetching social events:', error);
    throw error;
  }

  return events as SocialEventWithDetails[];
}
