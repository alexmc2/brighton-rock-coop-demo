'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ParticipationStatus } from '@/types/members/social';

interface GetUserAndParticipationResult {
  user: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  participationStatus: ParticipationStatus | null;
}

export async function getUserAndParticipation(
  eventId: string
): Promise<GetUserAndParticipationResult> {
  try {
    const supabase = createServerComponentClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { user: null, participationStatus: null };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get participation status
    const { data: participation, error: participationError } = await supabase
      .from('social_event_participants')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (participationError && participationError.code !== 'PGRST116') {
      throw participationError;
    }

    return {
      user: profile,
      participationStatus: participation?.status || null,
    };
  } catch (error) {
    console.error('Error fetching user and participation:', error);
    throw new Error('Failed to fetch user data');
  }
}

interface UpdateParticipationParams {
  eventId: string;
  userId: string;
  newStatus: ParticipationStatus | null;
}

export async function updateParticipation({
  eventId,
  userId,
  newStatus,
}: UpdateParticipationParams) {
  try {
    const supabase = createServerComponentClient({ cookies });

    if (newStatus === null) {
      // Remove participation
      const { error: deleteError } = await supabase
        .from('social_event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
    } else {
      // Add or update participation
      const { error: upsertError } = await supabase
        .from('social_event_participants')
        .upsert({
          event_id: eventId,
          user_id: userId,
          status: newStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating participation:', error);
    throw new Error('Failed to update participation');
  }
}
