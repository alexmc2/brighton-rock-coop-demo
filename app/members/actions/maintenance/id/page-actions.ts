'use server';

import { notFound } from 'next/navigation';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { MaintenanceRequestWithDetails } from '@/types/members/maintenance';

export async function getMaintenanceRequest(id: string) {
  try {
    const { data: request, error } = await supabaseAdmin
      .from('maintenance_requests')
      .select(
        `
        *,
        house:houses!maintenance_requests_house_id_fkey(name),
        reported_by_user:profiles!maintenance_requests_reported_by_fkey(email, full_name),
        assigned_to_user:profiles!maintenance_requests_assigned_to_fkey(email, full_name),
        visits:maintenance_visits(
          id,
          scheduled_date,
          estimated_duration,
          notes,
          completed_at,
          created_at
        ),
        comments:maintenance_comments(
          id,
          comment,
          created_at,
          user_id,
          user:profiles!maintenance_comments_user_id_fkey(
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .order('created_at', {
        foreignTable: 'maintenance_visits',
        ascending: true,
      })
      .order('created_at', {
        foreignTable: 'maintenance_comments',
        ascending: true,
      })
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return request as MaintenanceRequestWithDetails;
  } catch (err) {
    console.error('Error fetching maintenance request:', err);
    return null;
  }
}

export async function getHouses() {
  try {
    const { data: houses, error } = await supabaseAdmin
      .from('houses')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return houses;
  } catch (err) {
    console.error('Error fetching houses:', err);
    return [];
  }
}
