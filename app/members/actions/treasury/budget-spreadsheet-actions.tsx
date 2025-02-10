// app/members/actions/treasury/budget-spreadsheet-actions.tsx

'use server';

import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Matrix, CellBase } from 'react-spreadsheet';
import { revalidatePath } from 'next/cache';

type SpreadsheetCell = CellBase<string | number | null>;
type SpreadsheetData = Matrix<SpreadsheetCell>;

// Define helper function to revalidate budget-related paths
function revalidateBudgetPaths() {
  revalidatePath('/members/treasury/budgets');
  revalidatePath('/members/treasury/budgets/overview');
  revalidatePath('/members/treasury/budgets/proposals');
}

/**
 * Reads a 2D grid with columns [Category, Budget, Proposal, Year].
 * For each row, upserts into treasury_annual_budgets.
 */
export async function saveBudgetSpreadsheet(spreadsheet: SpreadsheetData) {
  try {
    const supabase = createServerActionClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const headerRow = spreadsheet[0] || [];
    if (headerRow.length < 4) {
      throw new Error('Spreadsheet missing columns in first row.');
    }

    let numUpserts = 0;

    // For each row after the header...
    for (let r = 1; r < spreadsheet.length; r++) {
      const row = spreadsheet[r];
      if (!row || row.length < 4) continue;

      const categoryNameRaw = row[0]?.value || '';
      const budgetRaw = row[1]?.value || '';
      const proposalRaw = row[2]?.value || 'Main';
      const yearRaw = row[3]?.value || '2024';

      // Skip blank lines
      if (!categoryNameRaw || !budgetRaw) {
        continue;
      }

      const categoryName = String(categoryNameRaw).trim();
      const annualBudget = parseFloat(String(budgetRaw));
      const proposalName = String(proposalRaw).trim();
      const fiscalYear = parseInt(String(yearRaw), 10);

      if (isNaN(annualBudget) || isNaN(fiscalYear)) continue;

      // 1) find category_id
      const { data: catData, error: catErr } = await supabaseAdmin
        .from('demo_treasury_categories')
        .select('id, name')
        .ilike('name', categoryName) // case-insensitive
        .maybeSingle();

      if (catErr) throw catErr;
      if (!catData) {
        console.log(`Skipping unknown category: ${categoryName}`);
        continue;
      }

      // 2) upsert row
      const { error: upsertErr } = await supabaseAdmin
        .from('demo_treasury_annual_budgets')
        .upsert({
          fiscal_year: fiscalYear,
          category_id: catData.id,
          annual_budget: annualBudget,
          proposal_name: proposalName || 'Main',
          created_by: user.id,
        });
      if (upsertErr) throw upsertErr;

      numUpserts++;
    }

    // Revalidate budget paths to avoid stale data
    revalidateBudgetPaths();

    return { success: true, rowsUpserted: numUpserts };
  } catch (err: any) {
    console.error('Error in saveBudgetSpreadsheet:', err);
    return { success: false, error: err.message };
  }
}
