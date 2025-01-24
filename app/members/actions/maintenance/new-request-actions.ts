'use server';

import { MaintenancePriority } from '@/types/members/maintenance';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceRequest({
  title,
  description,
  houseId,
  priority,
}: {
  title: string;
  description: string;
  houseId: string;
  priority: MaintenancePriority;
}) {
  try {
    const supabase = createServerActionClient({ cookies });

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not found');

    if (!houseId) {
      throw new Error('Please select a house');
    }

    // If "All Houses" is selected, create a request for each house
    if (houseId === '__all__') {
      // Get all houses
      const { data: houses, error: housesError } = await supabaseAdmin
        .from('demo_houses')
        .select('id')
        .order('name');

      if (housesError) throw housesError;

      // Create a request for each house
      for (const house of houses) {
        await supabaseAdmin.from('demo_maintenance_requests').insert({
          title,
          description,
          house_id: house.id,
          priority,
          reported_by: user.id,
          status: 'pending',
        });
      }
    } else {
      // Create a single request for the selected house
      const { error: insertError } = await supabaseAdmin
        .from('demo_maintenance_requests')
        .insert({
          title,
          description,
          house_id: houseId,
          priority,
          reported_by: user.id,
          status: 'pending',
        });

      if (insertError) throw insertError;
    }

    // Revalidate the maintenance page
    revalidatePath('/members/maintenance');

    return { success: true };
  } catch (err) {
    console.error('Error creating request:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create request',
    };
  }
}
