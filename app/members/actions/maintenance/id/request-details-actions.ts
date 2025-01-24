'use server';

import {
  MaintenancePriority,
  MaintenanceStatus,
} from '@/types/members/maintenance';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getUsers() {
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name')
    .order('full_name');

  if (error) throw error;
  return users;
}

export async function updateMaintenanceRequest(
  requestId: string,
  updates: {
    title: string;
    description: string;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    house_id: string;
    assigned_to: string | null;
  }
) {
  try {
    const { error: updateError } = await supabaseAdmin
      .from('maintenance_requests')
      .update(updates)
      .eq('id', requestId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export async function getUserProfile() {
  const supabase = createClientComponentClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single();
  
  if (profileError) throw profileError;
  
  return {
    userId: user.id,
    fullName: profile.full_name || profile.email
  };
}

export async function updateMaintenanceVisit(
  visitId: string,
  requestTitle: string,
  updates: {
    scheduled_date: string;
    estimated_duration: string;
    notes: string | null;
  },
  formData: FormData
) {
  try {
    // Get user profile
    const { userId, fullName } = await getUserProfile();

    // Format the date and duration
    const scheduledDate = `${formData.get('scheduled_date')}T${formData.get('scheduled_time')}:00`;
    const estimatedDuration = `${formData.get('estimated_duration')} hours`;
    const notes = (formData.get('notes') as string) || null;

    // Update the visit
    const { error: updateError } = await supabaseAdmin
      .from('maintenance_visits')
      .update({
        scheduled_date: scheduledDate,
        estimated_duration: estimatedDuration,
        notes,
      })
      .eq('id', visitId);

    if (updateError) throw updateError;

    // Calculate end time for calendar event
    const startTime = new Date(scheduledDate);
    const durationHours = parseInt(estimatedDuration.split(' ')[0]);
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    // First delete existing calendar event
    await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('reference_id', visitId)
      .eq('event_type', 'maintenance_visit');

    // Create new calendar event
    const { error: calendarError } = await supabaseAdmin
      .from('calendar_events')
      .insert({
        title: requestTitle,
        description: `Maintenance visit for: ${requestTitle}${notes ? `\nNotes: ${notes}` : ''}`,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        event_type: 'maintenance_visit',
        category: 'P4P Visit',
        created_by: userId,
        reference_id: visitId,
        full_name: fullName,
      });

    if (calendarError) throw calendarError;

    return { success: true };
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
}

export async function deleteMaintenanceVisit(visitId: string) {
  try {
    // Delete associated calendar events first
    await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('reference_id', visitId)
      .eq('event_type', 'maintenance_visit');

    // Delete the visit
    const { error } = await supabaseAdmin
      .from('maintenance_visits')
      .delete()
      .eq('id', visitId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting visit:', error);
    throw error;
  }
}
