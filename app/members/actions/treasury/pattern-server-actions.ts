'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/members/database';
import { revalidatePath } from 'next/cache';

export interface CategoryPattern {
  id: string;
  category_id: string;
  pattern: string;
  description: string;
  is_expense: boolean;
  confidence_score: number;
  match_count: number;
  created_at: string;
  last_matched_at: string | null;
  category?: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface CreatePatternInput {
  category_id: string;
  pattern: string;
  description: string;
  is_expense: boolean;
}

export async function createPatternAction(input: CreatePatternInput) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Validate the pattern by trying to create a RegExp
    new RegExp(input.pattern, 'i');

    const { data, error } = await supabase
      .from('demo_treasury_category_patterns')
      .insert({
        ...input,
        confidence_score: 1.0,
        match_count: 0,
        created_by: user.id,
      })
      .select(
        `
        *,
        category:demo_treasury_categories(
          id,
          name,
          description
        )
      `
      )
      .single();

    if (error) throw error;
    revalidatePath('/members/treasury/bookkeeping/category-patterns');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePatternAction(
  id: string,
  updates: Partial<CreatePatternInput>
) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    if (updates.pattern) {
      // Validate new pattern if provided
      new RegExp(updates.pattern, 'i');
    }

    const { data, error } = await supabase
      .from('demo_treasury_category_patterns')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        category:demo_treasury_categories(
          id,
          name,
          description
        )
      `
      )
      .single();

    if (error) throw error;
    revalidatePath('/members/treasury/bookkeeping/category-patterns');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePatternAction(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('demo_treasury_category_patterns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/members/treasury/bookkeeping/category-patterns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPatternsAction(isExpense?: boolean) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    let query = supabase
      .from('demo_treasury_category_patterns')
      .select(
        `
        *,
        category:demo_treasury_categories(
          id,
          name,
          description
        )
      `
      )
      .order('confidence_score', { ascending: false });

    if (typeof isExpense === 'boolean') {
      query = query.eq('is_expense', isExpense);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function suggestPatternsAction() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get recent unmatched transactions (those using default categories)
    const { data: transactions } = await supabase
      .from('demo_treasury_transactions')
      .select(
        `
        id,
        description,
        type,
        splits:demo_treasury_transaction_splits(
          category:demo_treasury_categories(
            id,
            name
          )
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (!transactions) return { success: true, data: [] };

    // Group similar descriptions and their categories
    const patterns = transactions.reduce((acc, tx) => {
      const desc = tx.description.toUpperCase().trim();
      const catArray = tx.splits?.[0]?.category;
      if (!Array.isArray(catArray) || catArray.length === 0) return acc;
      const category = catArray[0];
      const key = `${desc}|${category.name}`;
      if (!acc[key]) {
        acc[key] = {
          description: desc,
          category_id: category.id,
          count: 0,
          is_expense: tx.type === 'payment',
        };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, any>);

    // Convert to suggestions
    const suggestions = Object.values(patterns)
      .filter((p: any) => p.count >= 3) // Only suggest patterns that appear frequently
      .map((p: any) => ({
        description: p.description,
        category_id: p.category_id,
        suggested_pattern: `^${p.description.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )}$`,
        is_expense: p.is_expense,
        occurrence_count: p.count,
      }));

    return { success: true, data: suggestions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategoriesAction() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('demo_treasury_categories')
      .select('id, name, description, is_expense')
      .order('name');

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
