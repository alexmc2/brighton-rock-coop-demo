'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  ParticipationStatus,
  EventParticipant,
} from '@/types/members/development';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export async function getUserAndParticipationStatus(initiativeId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Get user's participation status for this event/initiative
    const { data: participation } = await supabase
      .from('event_participants')
      .select('status')
      .eq('event_id', initiativeId)
      .eq('user_id', user.id)
      .single();

    return {
      user: profile,
      participationStatus: participation?.status as ParticipationStatus | null,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      user: null,
      participationStatus: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch user data',
    };
  }
}

export async function getInitiativeParticipants(initiativeId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('event_participants')
      .select(
        `
        event_id,
        user_id,
        status,
        created_at,
        updated_at,
        user:profiles!event_participants_user_id_fkey (
          email,
          full_name
        )
      `
      )
      .eq('event_id', initiativeId)
      .returns<EventParticipant[]>();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching participants:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch participants',
    };
  }
}

export async function updateParticipationStatus(
  initiativeId: string,
  userId: string,
  newStatus: ParticipationStatus | null
) {
  const supabase = createServerComponentClient({ cookies });

  try {
    if (newStatus === null) {
      // Delete participation
      await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', initiativeId)
        .eq('user_id', userId);
    } else {
      // Upsert participation
      await supabase.from('event_participants').upsert({
        event_id: initiativeId,
        user_id: userId,
        status: newStatus,
      });
    }

    revalidatePath(`/members/development/${initiativeId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating participation:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update participation',
    };
  }
}
