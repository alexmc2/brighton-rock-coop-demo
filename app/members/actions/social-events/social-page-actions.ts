// app/members/actions/social-events/social-page-actions.ts

'use server';

import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { SocialEventWithDetails } from '@/types/members/social';

export async function getSocialEvents() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('demo_social_events')
      .select(
        `
        *,
        created_by_user:demo_profiles!demo_social_events_created_by_fkey(email, full_name),
        comments:demo_social_event_comments(
          *,
          user:demo_profiles!demo_social_event_comments_user_id_fkey(email, full_name)
        ),
        participants:demo_social_event_participants(
          *,
          user:demo_profiles!demo_social_event_participants_user_id_fkey(email, full_name)
        )
      `
      )
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching social events:', error);
      return [];
    }

    return events as SocialEventWithDetails[];
  } catch (err) {
    console.error('Error fetching social events:', err);
    return [];
  }
}
