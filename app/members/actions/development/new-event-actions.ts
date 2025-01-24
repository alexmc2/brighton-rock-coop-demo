'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  DevelopmentCategory,
  DevelopmentPriority,
} from '@/types/members/development';

interface CreateDevelopmentEventData {
  title: string;
  description: string;
  category: DevelopmentCategory;
  priority: DevelopmentPriority;
  eventDate: string;
  startTime: string;
  duration: string;
  location: string;
  openToEveryone: boolean;
}

export async function createDevelopmentEvent(data: CreateDevelopmentEventData) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Parse duration to interval
    let durationInterval: string | null = null;
    if (data.duration) {
      if (data.duration === '24') {
        durationInterval = '24 hours';
      } else {
        durationInterval = `${data.duration} hours`;
      }
    }

    const eventData = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      initiative_type: 'event' as const,
      created_by: user.id,
      event_date: data.eventDate
        ? new Date(data.eventDate).toISOString()
        : null,
      start_time: data.startTime || null,
      duration: durationInterval,
      location: data.location.trim() || null,
      max_participants: data.openToEveryone ? 12 : null,
      open_to_everyone: data.openToEveryone,
    };

    const { data: newInitiative, error: insertError } = await supabase
      .from('development_initiatives')
      .insert(eventData)
      .select()
      .single();

    if (insertError) throw insertError;

    if (data.eventDate && newInitiative) {
      const calendarData = {
        title: data.title,
        description: data.description,
        start_time: new Date(`${data.eventDate}T${data.startTime || '00:00'}`),
        end_time: new Date(`${data.eventDate}T${data.startTime || '00:00'}`),
        event_type: 'development_event' as const,
        reference_id: newInitiative.id,
        created_by: user.id,
        category: 'Development',
        subcategory: data.category,
        full_name: profile?.full_name,
      };

      const { error: calendarError } = await supabase
        .from('calendar_events')
        .insert(calendarData);

      if (calendarError) throw calendarError;
    }

    revalidatePath('/members/development');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating development event:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create development event',
    };
  }
}
