'use server';

import { MaintenanceStatus } from '@/types/members/maintenance';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function updateMaintenanceStatus(
  requestId: string,
  status: MaintenanceStatus
) {
  try {
    const { error } = await supabaseAdmin
      .from('maintenance_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

export async function deleteMaintenanceRequest(requestId: string) {
  try {
    // Delete associated calendar events first
    await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('reference_id', requestId)
      .eq('event_type', 'maintenance_request');

    // Then delete the request
    const { error } = await supabaseAdmin
      .from('maintenance_requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
}
