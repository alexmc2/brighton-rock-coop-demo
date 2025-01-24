'use server';

import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { DevelopmentInitiativeWithDetails } from '@/types/members/development';

export async function getInitiatives() {
  try {
    const { data: initiatives, error } = await supabaseAdmin
      .from('demo_development_initiatives')
      .select(
        `
        *,
        created_by_user:demo_profiles!demo_development_initiatives_created_by_fkey(email, full_name),
        comments:demo_development_comments(
          *,
          user:demo_profiles!demo_development_comments_user_id_fkey(
            email,
            full_name
          )
        ),
        participants:demo_event_participants(
          *,
          user:demo_profiles!demo_event_participants_user_id_fkey(
            email,
            full_name
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching initiatives:', error);
      return [];
    }

    return initiatives as DevelopmentInitiativeWithDetails[];
  } catch (err) {
    console.error('Error fetching initiatives:', err);
    return [];
  }
}
