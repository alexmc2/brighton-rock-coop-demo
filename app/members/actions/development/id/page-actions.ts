'use server';

import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { DevelopmentInitiativeWithDetails } from '@/types/members/development';

export async function getInitiativeById(id: string) {
  try {
    const { data: initiative, error } = await supabaseAdmin
      .from('development_initiatives')
      .select(
        `
        *,
        created_by_user:profiles!development_initiatives_created_by_fkey(email, full_name),
        comments:development_comments(
          *,
          user:profiles!development_comments_user_id_fkey(
            email,
            full_name
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return initiative as DevelopmentInitiativeWithDetails;
  } catch (err) {
    console.error('Error fetching initiative:', err);
    return null;
  }
}
