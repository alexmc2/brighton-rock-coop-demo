// app/members/actions/treasury/budget-actions.tsx

'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import { TreasuryCategory } from '@/types/members/treasury';

// ----------------------------------------------------------------------------
// Helper: Revalidate budget‐related pages. Adjust as your routing changes.
// ----------------------------------------------------------------------------
function revalidateBudgetPaths() {
  revalidatePath('/members/treasury/budgets');
  revalidatePath('/members/treasury/budgets/overview');
  revalidatePath('/members/treasury/budgets/proposals');
}

/**
 * Rename all rows for (fiscalYear, oldProposalName) -> "This budget agreed".
 * Also deletes any old "This budget agreed" lines first, so you only have one final set.
 */
export async function markProposalAsAgreed(
  fiscalYear: number,
  oldProposalName: string
) {
  try {
    await supabaseAdmin
      .from('demo_treasury_annual_budgets')
      .delete()
      .eq('fiscal_year', fiscalYear)
      .eq('proposal_name', 'This budget agreed');

    const { data, error } = await supabaseAdmin
      .from('demo_treasury_annual_budgets')
      .update({ proposal_name: 'This budget agreed' })
      .eq('fiscal_year', fiscalYear)
      .eq('proposal_name', oldProposalName)
      .select();

    if (error) throw error;
    revalidateBudgetPaths();

    console.log(
      `Renamed proposals "${oldProposalName}" to "This budget agreed" for fiscal year ${fiscalYear}. Rows affected: ${data?.length}`
    );
    return { success: true, rowCount: data?.length || 0 };
  } catch (err: any) {
    console.error('Error in markProposalAsAgreed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Return the lines for the "This budget agreed" proposal, for the given year.
 */
export async function getAgreedBudgetForYear(fiscalYear: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_annual_budgets')
      .select('*, category:demo_treasury_categories(*)')
      .eq('fiscal_year', fiscalYear)
      .eq('proposal_name', 'This budget agreed');
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Error in getAgreedBudgetForYear:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Return *all* proposals for a given year (multiple proposals).
 * We will store them with a `proposal_name` and `annual_budget`.
 */
export async function getBudgetProposalsForYear(fiscalYear: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_annual_budgets')
      .select('id, category_id, proposal_name, annual_budget, notes')
      .eq('fiscal_year', fiscalYear);
    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error('Error in getBudgetProposalsForYear:', err);
    return { success: false, error: String(err) };
  }
}

export interface TransactionSplit {
  category_id: string;
  amount: number;
  transaction: {
    date: string;
  } | null;
  category: {
    id: string;
    name: string;
    is_expense: boolean;
  } | null;
}

/**
 * Summarize actual spending for each category in the given "fiscalYear" range:
 *  - If `fiscalYear=2024`, that means:
 *     Start = 1 Apr 2023
 *     End   = 31 Mar 2024
 *  - If selectedMonth is provided (1-12), end date will be last day of that month
 * Return an object { [category_id]: totalSpent }
 */
export async function getActualSpendingForYear(
  fiscalYear: number,
  selectedMonth?: number
) {
  try {
    // Calculate your start/end date range:
    const start = new Date(Date.UTC(fiscalYear - 1, 3, 1)); // Always April 1st

    let end: Date;
    if (selectedMonth) {
      // For months 1-3 (Jan-Mar), use the fiscal year; for 4-12 (Apr-Dec), use fiscal year - 1
      const year = selectedMonth <= 3 ? fiscalYear : fiscalYear - 1;
      end = new Date(Date.UTC(year, selectedMonth, 0, 23, 59, 59, 999)); // Last day of selected month
    } else {
      end = new Date(Date.UTC(fiscalYear, 2, 31, 23, 59, 59, 999)); // March 31st
    }

    // Pull the splits, including whether the category is_expense:
    const { data, error } = (await supabaseAdmin
      .from('demo_treasury_transaction_splits')
      .select(
        `
        category_id,
        amount,
        transaction:demo_treasury_transactions(date),
        category:demo_treasury_categories(id, name, is_expense)
      `
      )
      .gte('transaction.date', start.toISOString())
      .lte('transaction.date', end.toISOString())) as {
      data: TransactionSplit[] | null;
      error: any;
    };

    if (error) throw error;

    // Sum amounts by category
    const sums: Record<string, number> = {};
    for (const row of data || []) {
      // Only proceed if we got category and date
      if (!row.category_id || !row.transaction?.date) continue;

      // The raw amount from the DB
      let amt = Number(row.amount || 0);

      // For income categories (is_expense = false), negate the amount
      // This converts negative DB amounts to positive display amounts
      if (!row.category?.is_expense) {
        amt = -amt;
      }

      sums[row.category_id] = (sums[row.category_id] || 0) + amt;
    }

    return { success: true, data: sums, transactions: data || [] };
  } catch (err: any) {
    console.error('Error in getActualSpendingForYear:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Return a map from category_id => category_name for display
 */
export async function getAllCategoriesMap() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id, name');
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const cat of data) {
      map[cat.id] = cat.name;
    }
    return map;
  } catch (err) {
    console.error('Error in getAllCategoriesMap:', err);
    return {};
  }
}

/**
 * Upsert a single cell from the big sheet into `treasury_annual_budgets`.
 * e.g. a row for: { categoryName="Food", proposalName="Proposal 1", annualBudget=2000, year=2024 }
 */
export async function upsertBudgetLine({
  categoryName,
  proposalName,
  annualBudget,
  fiscalYear,
  isExpense = true,
}: {
  categoryName: string;
  proposalName: string;
  annualBudget: number;
  fiscalYear: number;
  isExpense?: boolean;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Not authenticated');

  // 1) find or create the category
  let categoryId: string | null = null;
  // Try match ignoring case
  const { data: catData, error: catErr } = await supabaseAdmin
    .from('demo_treasury_categories')
    .select('id')
    .ilike('name', categoryName)
    .maybeSingle();
  if (catErr) throw catErr;

  if (!catData) {
    // Create new category if none found
    const { data: newCat, error: newCatErr } = await supabaseAdmin
      .from('demo_treasury_categories')
      .insert({
        name: categoryName,
        is_expense: isExpense,
      })
      .select()
      .single();
    if (newCatErr) throw newCatErr;
    categoryId = newCat.id;
  } else {
    categoryId = catData.id;
  }

  // 2) Delete any existing budget line for the same {fiscal_year, category_id, proposal_name} to avoid duplicates
  const { error: deleteErr } = await supabaseAdmin
    .from('demo_treasury_annual_budgets')
    .delete()
    .eq('fiscal_year', fiscalYear)
    .eq('category_id', categoryId)
    .eq('proposal_name', proposalName);
  if (deleteErr) throw deleteErr;

  // 3) Insert the new row
  const { error: insertErr } = await supabaseAdmin
    .from('demo_treasury_annual_budgets')
    .insert({
      fiscal_year: fiscalYear,
      category_id: categoryId,
      proposal_name: proposalName || 'Main',
      annual_budget: annualBudget,
      created_by: user.id,
    });
  if (insertErr) throw insertErr;

  revalidateBudgetPaths();
  return { success: true };
}

/**
 * Delete all budget lines for a given fiscal year
 */
export async function deleteBudgetForYear(fiscalYear: number) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabaseAdmin
    .from('demo_treasury_annual_budgets')
    .delete()
    .eq('fiscal_year', fiscalYear);
  if (error) throw error;

  revalidateBudgetPaths();
  return { success: true };
}

// --------------------------------------------------------
// 4) GET CATEGORIES
// --------------------------------------------------------
export async function getCategories(): Promise<
  | { success: true; data: TreasuryCategory[] }
  | { success: false; error: string }
> {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return { success: true, data: data as TreasuryCategory[] };
  } catch (err) {
    console.error('Error fetching categories:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

interface CategoryTotal {
  category_name: string;
  category_id: string;
  is_expense: boolean;
  total_amount: number;
}

interface BudgetReport {
  byCategory: CategoryTotal[];
  summary: {
    total_income: number;
    total_expenses: number;
    net_position: number;
  };
}

export async function getFiscalYearBudgetReport(): Promise<
  { success: true; data: BudgetReport } | { success: false; error: string }
> {
  try {
    // Get current fiscal year dates
    const now = new Date();
    const currentYear =
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const startMonth = `${currentYear}-04`; // April of fiscal year start
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_category_totals')
      .select('*')
      .gte('month', startMonth)
      .lte('month', currentMonth);

    if (error) throw error;

    // Group by category and sum amounts
    const categoryMap = new Map<string, CategoryTotal>();

    data?.forEach((row) => {
      const amount = Number(row.total_amount);
      const existing = categoryMap.get(row.category_id);

      if (existing) {
        existing.total_amount += amount;
      } else {
        categoryMap.set(row.category_id, {
          category_id: row.category_id,
          category_name: row.category_name,
          is_expense: row.is_expense,
          total_amount: amount,
        });
      }
    });

    // Convert to array and calculate summary
    const byCategory = Array.from(categoryMap.values());
    const summary = {
      total_income: byCategory
        .filter((cat) => !cat.is_expense)
        .reduce((sum, cat) => sum + cat.total_amount, 0),
      total_expenses: byCategory
        .filter((cat) => cat.is_expense)
        .reduce((sum, cat) => sum + cat.total_amount, 0),
      net_position: 0,
    };
    summary.net_position = summary.total_income - summary.total_expenses;

    return {
      success: true,
      data: {
        byCategory,
        summary,
      },
    };
  } catch (err) {
    console.error('Error getting fiscal year budget report:', err);
    return { success: false, error: String(err) };
  }
}

export interface DetailedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string;
  category_name: string;
  is_expense: boolean;
}

interface TransactionData {
  id: string;
  amount: number;
  transaction: {
    date: string;
    description: string;
  };
  category: {
    id: string;
    name: string;
    is_expense: boolean;
  };
}

interface MonthlyReport {
  transactions: DetailedTransaction[];
  monthlySummary: {
    month: string;
    income: number;
    expenses: number;
    net: number;
  }[];
  categories: {
    id: string;
    name: string;
    is_expense: boolean;
  }[];
}

export async function getDetailedTransactionReport(
  fiscalYear: number,
  month?: string
): Promise<
  { success: true; data: MonthlyReport } | { success: false; error: string }
> {
  try {
    // Calculate fiscal year date range
    const startDate = new Date(Date.UTC(fiscalYear - 1, 3, 1)); // April 1st
    let endDate: Date;

    if (month) {
      // For months 1-3 (Jan-Mar), use the fiscal year; for 4-12 (Apr-Dec), use fiscal year - 1
      const monthNum = parseInt(month, 10);
      const year = monthNum <= 3 ? fiscalYear : fiscalYear - 1;
      endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999)); // Last day of selected month
    } else {
      endDate = new Date(Date.UTC(fiscalYear, 2, 31, 23, 59, 59, 999)); // March 31st
    }

    // Build the query
    let query = supabaseAdmin
      .from('demo_treasury_transaction_splits')
      .select(
        `
        id,
        amount,
        transaction:demo_treasury_transactions!inner(date, description),
        category:demo_treasury_categories!inner(id, name, is_expense)
      `
      )
      .gte('transaction.date', startDate.toISOString())
      .lte('transaction.date', endDate.toISOString())
      .order('date', { foreignTable: 'transaction', ascending: false });

    const { data: transactionData, error } = await query;
    if (error) throw error;

    // Get all categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id, name, is_expense')
      .order('name');
    if (catError) throw catError;

    // Process transactions
    const transactions: DetailedTransaction[] = transactionData
      .filter((t: any) => t.transaction && t.category)
      .map((t: any) => ({
        id: t.id,
        date: t.transaction.date,
        description: t.transaction.description || '',
        amount: Number(t.amount),
        category_id: t.category.id,
        category_name: t.category.name,
        is_expense: t.category.is_expense,
      }));

    // Calculate monthly summaries
    const monthlySummary = calculateMonthlySummary(transactions, fiscalYear);

    return {
      success: true,
      data: {
        transactions,
        monthlySummary,
        categories,
      },
    };
  } catch (err) {
    console.error('Error in getDetailedTransactionReport:', err);
    return { success: false, error: String(err) };
  }
}

function calculateMonthlySummary(
  transactions: DetailedTransaction[],
  fiscalYear: number
) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 4 > 12 ? i - 8 : i + 4; // Convert to fiscal year months (4-12, 1-3)
    return {
      month: monthNum.toString().padStart(2, '0'),
      income: 0,
      expenses: 0,
      net: 0,
    };
  });

  transactions.forEach((t) => {
    const date = new Date(t.date);
    let monthIndex = date.getMonth();

    // Adjust month index for fiscal year (Apr-Mar)
    monthIndex = monthIndex >= 3 ? monthIndex - 3 : monthIndex + 9;

    const amount = Math.abs(Number(t.amount));
    if (t.is_expense) {
      months[monthIndex].expenses += amount;
    } else {
      months[monthIndex].income += amount;
    }
    months[monthIndex].net =
      months[monthIndex].income - months[monthIndex].expenses;
  });

  return months;
}
