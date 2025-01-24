'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { SocialEventCategory } from '@/types/members/social';

interface CreateSocialEventData {
  title: string;
  description: string;
  category: SocialEventCategory;
  eventDate: string;
  startTime: string;
  duration: string;
  location: string;
  openToEveryone: boolean;
}

export async function createSocialEvent(data: CreateSocialEventData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('demo_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const durationInterval = data.duration ? `${data.duration} hours` : null;

    const eventData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      status: 'upcoming' as const,
      created_by: user.id,
      event_date: data.eventDate
        ? new Date(data.eventDate).toISOString()
        : null,
      start_time: data.startTime ? `${data.startTime}:00` : null,
      duration: durationInterval,
      location: data.location.trim() || null,
      open_to_everyone: data.openToEveryone,
    };

    const { data: newEvent, error: insertError } = await supabase
      .from('demo_social_events')
      .insert(eventData)
      .select()
      .single();

    if (insertError) throw insertError;

    if (data.eventDate && newEvent) {
      const calendarData = {
        title: data.title,
        description: data.description,
        start_time: new Date(`${data.eventDate}T${data.startTime || '00:00'}`),
        end_time: new Date(`${data.eventDate}T${data.startTime || '00:00'}`),
        event_type: 'social_event' as const,
        reference_id: newEvent.id,
        created_by: user.id,
        category: 'Co-op Social',
        subcategory: data.category,
        full_name: profile?.full_name,
      };

      const { error: calendarError } = await supabase
        .from('demo_calendar_events')
        .insert(calendarData);

      if (calendarError) throw calendarError;
    }

    revalidatePath('/members/co-op-socials');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating social event:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create social event',
    };
  }
}
