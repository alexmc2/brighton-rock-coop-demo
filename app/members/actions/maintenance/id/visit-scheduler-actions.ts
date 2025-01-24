'use server';

import { createMaintenanceVisitEventServer } from '@/app/members/actions/calendar/calendar-page-actions';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function scheduleMaintenanceVisit(
  requestId: string,
  requestTitle: string,
  formData: FormData
) {
  try {
    const scheduledDate = `${formData.get('scheduled_date')}T${formData.get(
      'scheduled_time'
    )}:00`;
    const estimatedDuration = formData.get('estimated_duration') as string;
    const notes = formData.get('notes') || null;

    // Get current user from the form data or session
    const userId = formData.get('userId') as string;
    if (!userId) throw new Error('User not authenticated');

    // Get user's profile using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('demo_profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;

    // Insert the visit using admin client
    const { data: newVisit, error: insertError } = await supabaseAdmin
      .from('demo_maintenance_visits')
      .insert({
        request_id: requestId,
        scheduled_date: scheduledDate,
        estimated_duration: `${estimatedDuration} hours`,
        notes,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Only update status if it's pending
    const { data: request } = await supabaseAdmin
      .from('demo_maintenance_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (request?.status === 'pending') {
      const { error: updateError } = await supabaseAdmin
        .from('demo_maintenance_requests')
        .update({ status: 'scheduled' })
        .eq('id', requestId);

      if (updateError) throw updateError;
    }

    // Create calendar event using server version
    await createMaintenanceVisitEventServer(
      newVisit.id,
      requestTitle,
      `Maintenance visit for: ${requestTitle}${
        notes ? `\nNotes: ${notes}` : ''
      }`,
      scheduledDate,
      `${estimatedDuration} hours`,
      userId,
      profile.full_name || profile.email
    );

    return { success: true };
  } catch (error) {
    console.error('Error scheduling visit:', error);
    throw error;
  }
}
