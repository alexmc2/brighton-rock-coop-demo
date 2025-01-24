'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DoodlePollResponse } from '@/types/members/doodle';

interface ToggleResponseParams {
  pollId: string;
  optionId: string;
  userId: string;
  participantId?: string;
  currentResponses: Record<string, DoodlePollResponse>;
}

export async function togglePollResponse({
  pollId,
  optionId,
  userId,
  participantId,
  currentResponses,
}: ToggleResponseParams) {
  try {
    const supabase = createServerComponentClient({ cookies });

    // Calculate new response state
    const newResponses = { ...currentResponses };
    const current = newResponses[optionId];

    if (!current) {
      newResponses[optionId] = 'yes';
    } else if (current === 'yes') {
      newResponses[optionId] = 'maybe';
    } else if (current === 'maybe') {
      newResponses[optionId] = 'no';
    } else if (current === 'no') {
      delete newResponses[optionId]; // Remove the response to go back to no response
    }

    if (participantId) {
      // Update existing participant
      const { error: updateError } = await supabase
        .from('demo_doodle_poll_participants')
        .update({
          responses: newResponses,
          updated_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (updateError) throw updateError;
    } else {
      // Create new participant
      const { error: insertError } = await supabase
        .from('demo_doodle_poll_participants')
        .insert({
          poll_id: pollId,
          user_id: userId,
          responses: newResponses,
        });

      if (insertError) throw insertError;
    }

    return { success: true, responses: newResponses };
  } catch (error) {
    console.error('Error updating poll response:', error);
    throw new Error('Failed to update poll response');
  }
}
