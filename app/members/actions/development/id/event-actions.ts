'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  DevelopmentCategory,
  DevelopmentPriority,
  DevelopmentStatus,
} from '@/types/members/development';

interface UpdateDevelopmentEventData {
  id: string;
  title: string;
  description: string;
  category: DevelopmentCategory;
  priority: DevelopmentPriority;
  status: DevelopmentStatus;
  event_date: string | null;
  start_time: string | null;
  duration: string | null;
  location: string | null;
  open_to_everyone: boolean;
}

export async function updateDevelopmentEvent(data: UpdateDevelopmentEventData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const updateData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      status: data.status,
      event_date: data.event_date
        ? new Date(data.event_date).toISOString()
        : null,
      start_time: data.start_time || null,
      duration: data.duration,
      location: data.location?.trim() || null,
      max_participants: data.open_to_everyone ? 12 : null,
      open_to_everyone: data.open_to_everyone,
    };

    // Update development initiative
    const { error: updateError } = await supabase
      .from('development_initiatives')
      .update(updateData)
      .eq('id', data.id);

    if (updateError) throw updateError;

    // Handle calendar event
    if (data.event_date) {
      // Delete existing calendar event
      await supabase
        .from('calendar_events')
        .delete()
        .eq('reference_id', data.id)
        .eq('event_type', 'development_event');

      // Create new calendar event
      const calendarData = {
        title: data.title,
        description: data.description,
        start_time: new Date(
          `${data.event_date}T${data.start_time || '00:00'}`
        ),
        end_time: new Date(`${data.event_date}T${data.start_time || '00:00'}`),
        event_type: 'development_event' as const,
        reference_id: data.id,
        created_by: user.id,
        category: 'Development',
        subcategory: data.category,
        full_name: profile?.full_name,
      };

      await supabase
        .from('calendar_events')
        .insert(calendarData)
        .throwOnError();
    }

    // Fetch updated initiative data
    const { data: updatedInitiative, error: fetchError } = await supabase
      .from('development_initiatives')
      .select(
        `
        *,
        created_by_user:profiles!development_initiatives_created_by_fkey (
          email,
          full_name
        ),
        comments:development_comments (
          *,
          user:profiles (
            email,
            full_name
          )
        ),
        participants:event_participants (
          *,
          user:profiles (
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
    if (!updatedInitiative)
      throw new Error('Failed to retrieve updated initiative data');

    revalidatePath('/members/development');
    return { data: updatedInitiative, error: null };
  } catch (error) {
    console.error('Error updating development event:', error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update development event',
    };
  }
}

export async function deleteDevelopmentEvent(eventId: string) {
  const supabase = createServerComponentClient({ cookies });

  try {
    // Delete associated calendar events first
    await supabase
      .from('calendar_events')
      .delete()
      .eq('reference_id', eventId)
      .eq('event_type', 'development_event')
      .throwOnError();

    // Delete the initiative and related data
    await supabase
      .rpc('delete_initiative', { p_initiative_id: eventId })
      .throwOnError();

    revalidatePath('/members/development');
    return { error: null };
  } catch (error) {
    console.error('Error deleting development event:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete development event',
    };
  }
}
