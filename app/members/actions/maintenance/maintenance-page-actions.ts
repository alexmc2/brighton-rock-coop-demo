'use server';

import { MaintenanceRequestWithDetails } from '@/types/members/maintenance';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export async function getMaintenanceRequests() {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('demo_maintenance_requests')
      .select(
        `
        *,
        house:houses!demo_maintenance_requests_house_id_fkey(id, name),
        reported_by_user:demo_profiles!demo_maintenance_requests_reported_by_fkey(email, full_name),
        assigned_to_user:demo_profiles!demo_maintenance_requests_assigned_to_fkey(email, full_name),
        visits:demo_maintenance_visits(*),
        comments:demo_maintenance_comments(*)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance requests:', error);
      return [];
    }

    return requests as MaintenanceRequestWithDetails[];
  } catch (err) {
    console.error('Error fetching maintenance requests:', err);
    return [];
  }
}

export async function getHouses() {
  try {
    const { data: houses, error } = await supabaseAdmin
      .from('demo_houses')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching houses:', error);
      return [];
    }

    // Add "All Houses" option at the beginning
    const allHousesOption = {
      id: '__all__', // Special ID that won't conflict with UUIDs
      name: 'All Houses',
      virtual: true,
    };

    return [allHousesOption, ...houses];
  } catch (err) {
    console.error('Error fetching houses:', err);
    return [];
  }
}
