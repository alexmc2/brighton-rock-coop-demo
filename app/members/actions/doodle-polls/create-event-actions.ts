'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  DoodlePoll,
  DoodlePollOption,
  DoodlePollParticipant,
  participationMapping,
} from '@/types/members/doodle';

interface CreateEventFromPollData {
  poll: DoodlePoll;
  selectedTimeSlot: DoodlePollOption;
  participants: DoodlePollParticipant[];
}

export async function createEventFromPoll({
  poll,
  selectedTimeSlot,
  participants,
}: CreateEventFromPollData) {
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

    const mapping = participationMapping[poll.event_type];
    if (!mapping) throw new Error('Invalid event type');

    const eventDateTime = new Date(selectedTimeSlot.date);
    if (selectedTimeSlot.start_time) {
      const [hour, minute] = selectedTimeSlot.start_time.split(':');
      eventDateTime.setHours(parseInt(hour, 10));
      eventDateTime.setMinutes(parseInt(minute, 10));
    }

    const durationInHours = selectedTimeSlot.duration
      ? parseFloat(selectedTimeSlot.duration)
      : null;

    const endDateTime = new Date(eventDateTime);
    if (durationInHours) {
      endDateTime.setHours(
        endDateTime.getHours() + Math.floor(durationInHours)
      );
      endDateTime.setMinutes(
        endDateTime.getMinutes() + (durationInHours % 1) * 60
      );
    }

    let createdEventId: string | undefined;

    if (poll.event_type === 'social_event') {
      // Create a social event
      const { data: socialEvent, error: socialEventError } = await supabase
        .from('social_events')
        .insert({
          title: poll.title,
          description: poll.description,
          category: poll.category,
          location: poll.location,
          created_by: user.id,
          event_date: eventDateTime.toISOString(),
          start_time: selectedTimeSlot.start_time || null,
          duration: durationInHours ? `${durationInHours} hours` : null,
          status: 'upcoming',
          open_to_everyone: true,
        })
        .select()
        .single();

      if (socialEventError) {
        console.error('Event creation error:', socialEventError);
        throw new Error(`Failed to create event: ${socialEventError.message}`);
      }

      createdEventId = socialEvent.id;

      // Create participants for the social event
      const participantsToCreate = participants.map((p) => ({
        event_id: createdEventId,
        user_id: p.user_id,
        status: mapping.statusValues[p.responses[selectedTimeSlot.id] || 'no'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (participantsToCreate.length > 0) {
        const { error: participantsError } = await supabase
          .from('social_event_participants')
          .insert(participantsToCreate);
        if (participantsError) {
          console.error('Participant creation error:', participantsError);
          throw new Error('Failed to create event participants');
        }
      }
    } else if (poll.event_type === 'development_event') {
      // Create development event
      const { data: devEvent, error: devEventError } = await supabase
        .from('development_initiatives')
        .insert({
          title: poll.title,
          description: poll.description,
          category: poll.category || 'general',
          location: poll.location,
          created_by: user.id,
          event_date: eventDateTime.toISOString(),
          start_time: selectedTimeSlot.start_time || null,
          duration: durationInHours ? `${durationInHours} hours` : null,
          status: 'active',
          initiative_type: 'event',
          priority: 'medium',
          open_to_everyone: true,
        })
        .select()
        .single();

      if (devEventError) {
        console.error('Event creation error:', devEventError);
        throw new Error(`Failed to create event: ${devEventError.message}`);
      }

      createdEventId = devEvent.id;

      // Create participants for the development event
      const participantsToCreate = participants
        .filter(
          (p) =>
            p.responses[selectedTimeSlot.id] === 'yes' ||
            p.responses[selectedTimeSlot.id] === 'maybe'
        )
        .map((p) => ({
          event_id: createdEventId,
          user_id: p.user_id,
          status:
            mapping.statusValues[p.responses[selectedTimeSlot.id] || 'no'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      if (participantsToCreate.length > 0) {
        // Insert participants one by one to handle RLS policies
        for (const participant of participantsToCreate) {
          const { error: participantError } = await supabase
            .from('event_participants')
            .insert(participant);

          if (participantError) {
            console.error('Participant creation error:', participantError);
            // Continue with other participants even if one fails
            console.warn(`Failed to add participant ${participant.user_id}`);
          }
        }
      }
    }

    // Create calendar event for all event types
    const calendarData = {
      title: poll.title,
      description: poll.description,
      start_time: eventDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      event_type: poll.event_type,
      category:
        poll.event_type === 'social_event'
          ? 'Co-op Social'
          : poll.event_type === 'development_event'
          ? 'Development'
          : poll.event_type,
      subcategory: poll.category,
      created_by: user.id,
      reference_id: createdEventId || poll.id,
      updated_at: new Date().toISOString(),
      full_name: profile?.full_name || null,
    };

    const { error: calendarError } = await supabase
      .from('calendar_events')
      .insert(calendarData);

    if (calendarError) {
      console.error('Calendar event creation error:', calendarError);
      throw new Error('Failed to create calendar event');
    }

    // Update the poll status
    const pollUpdateData = {
      closed: true,
      updated_at: new Date().toISOString(),
      event_id: poll.event_type === 'social_event' ? createdEventId : null,
    };

    const { error: pollError } = await supabase
      .from('doodle_polls')
      .update(pollUpdateData)
      .eq('id', poll.id);

    if (pollError) {
      console.error('Poll update error:', pollError);
      throw new Error('Failed to update poll status');
    }

    revalidatePath('/members/doodle-polls');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event',
    };
  }
}
