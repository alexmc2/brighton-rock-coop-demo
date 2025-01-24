'use server';

import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { SocialEventWithDetails } from '@/types/members/social';

export async function getSocialEventById(id: string) {
  try {
    const { data: event, error } = await supabaseAdmin
      .from('social_events')
      .select(
        `
        *,
        created_by_user:profiles!social_events_created_by_fkey(
          id,
          email,
          full_name
        ),
        comments:social_event_comments(
          *,
          user:profiles!social_event_comments_user_id_fkey(
            id,
            email,
            full_name
          )
        ),
        participants:social_event_participants(
          *,
          user:profiles!social_event_participants_user_id_fkey(
            id,
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return event as SocialEventWithDetails;
  } catch (err) {
    console.error('Error fetching social event:', err);
    return null;
  }
}
