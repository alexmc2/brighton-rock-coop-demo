// Server-side actions for social events
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { SocialEventCategory, SocialEventStatus } from '@/types/members/social';

interface UpdateSocialEventData {
  id: string;
  title: string;
  description: string;
  category: SocialEventCategory;
  status: SocialEventStatus;
  event_date: string | null;
  start_time: string | null;
  duration: string | null;
  location: string | null;
  open_to_everyone: boolean;
}

export async function updateSocialEvent(data: UpdateSocialEventData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Get current user and profile
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('demo_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Prepare update data
    const timeWithSeconds = data.start_time ? `${data.start_time}:00` : null;

    const updateData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      status: data.status,
      event_date: data.event_date
        ? new Date(data.event_date).toISOString()
        : null,
      start_time: timeWithSeconds,
      duration: data.duration,
      location: data.location?.trim() || null,
      open_to_everyone: data.open_to_everyone,
      updated_at: new Date().toISOString(),
    };

    // Update social event
    const { error: updateError } = await supabase
      .from('demo_social_events')
      .update(updateData)
      .eq('id', data.id);

    if (updateError) throw updateError;

    // Handle calendar event
    if (data.event_date) {
      // Delete existing calendar event
      await supabase
        .from('demo_calendar_events')
        .delete()
        .eq('reference_id', data.id)
        .eq('event_type', 'social_event');

      // Create new calendar event
      const calendarData = {
        title: data.title,
        description: data.description,
        start_time: new Date(
          `${data.event_date}T${data.start_time || '00:00'}`
        ),
        end_time: new Date(`${data.event_date}T${data.start_time || '00:00'}`),
        event_type: 'demo_social_event' as const,
        reference_id: data.id,
        created_by: user.id,
        category: 'Co-op Social',
        subcategory: data.category,
        full_name: profile?.full_name,
      };

      await supabase
        .from('demo_calendar_events')
        .insert(calendarData)
        .throwOnError();
    }

    // Fetch updated event data
    const { data: updatedEvent, error: fetchError } = await supabase
      .from('demo_social_events')
      .select(
        `
        *,
        created_by_user:demo_profiles!demo_social_events_created_by_fkey (
          email,
          full_name
        ),
        comments:demo_social_event_comments (
          *,
          user:demo_profiles (
            email,
            full_name
          )
        ),
        participants:demo_social_event_participants (
          *,
          user:demo_profiles (
            id,
            email,
            full_name
          )
        )
      `
      )
      .eq('id', data.id)
      .single();

    if (fetchError) throw fetchError;
    if (!updatedEvent) throw new Error('Failed to retrieve updated event data');

    revalidatePath('/members/co-op-socials');
    return { data: updatedEvent, error: null };
  } catch (error) {
    console.error('Error updating event:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update event',
    };
  }
}

export async function deleteSocialEvent(eventId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Delete associated calendar events first
    await supabase
      .from('demo_calendar_events')
      .delete()
      .eq('reference_id', eventId)
      .eq('event_type', 'social_event')
      .throwOnError();

    // Delete the social event and related data
    await supabase
      .rpc('delete_social_event', { p_event_id: eventId })
      .throwOnError();

    revalidatePath('/members/co-op-socials');
    return { error: null };
  } catch (error) {
    console.error('Error deleting event:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete event',
    };
  }
}
