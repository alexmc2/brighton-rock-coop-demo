// app/members/actions/treasury/bookkeeping-actions.ts

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import supabaseAdmin from '@/lib/members/supabaseAdmin';
import type {
  TreasuryCategory,
  TransactionSplit,
  TreasuryTransaction,
  MonthlyBalance,
  TransactionCreateInput,
  MonthlyBalanceCreateInput,
  MonthlyDraftInput,
  ActionResponse,
  CategoryPattern,
  CategoryPatternCreateInput,
} from '@/types/members/treasury';

// Add new types for transaction history
interface TransactionHistory {
  id: string;
  transaction_id: string;
  original_date: string;
  modified_date: string;
  modified_by: string;
  modified_at: string;
}

interface TransactionWithHistory extends TreasuryTransaction {
  history?: TransactionHistory[];
}

interface TransactionUpdateContext {
  originalDate: Date;
  newDate: Date;
  transactionId: string;
  userId: string;
}

// Helper function to record transaction date changes
async function recordTransactionDateChange({
  originalDate,
  newDate,
  transactionId,
  userId,
}: TransactionUpdateContext) {
  const { error } = await supabaseAdmin
    .from('demo_treasury_transaction_history')
    .insert({
      transaction_id: transactionId,
      original_date: originalDate.toISOString(),
      modified_date: newDate.toISOString(),
      modified_by: userId,
    });

  if (error) throw error;
}

// Helper to check if a date falls within a month
function isDateInMonth(date: Date, month: Date): boolean {
  return (
    date.getUTCFullYear() === month.getUTCFullYear() &&
    date.getUTCMonth() === month.getUTCMonth()
  );
}

// Helper function to revalidate all necessary paths
function revalidateAllPaths() {
  revalidatePath('/members/treasury');
  revalidatePath('/members/treasury/bookkeeping');
  revalidatePath('/members/treasury/bookkeeping/bank-reconciliation');
  revalidatePath('/members/treasury/bookkeeping/past-reconciliations');
  revalidatePath('/members/treasury/bookkeeping/reconciled-transactions');
  revalidatePath('/members/treasury/budgets/overview');
}

/////////////////////////////////////////////////////////////////////////////////
// 1) CREATE TRANSACTION
/////////////////////////////////////////////////////////////////////////////////
export async function createTransaction(input: TransactionCreateInput) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // Get the bank category ID
    const { data: bankCategory, error: bankCategoryError } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id')
      .eq('name', 'Bank Account')
      .single();

    if (bankCategoryError) throw bankCategoryError;
    if (!bankCategory) throw new Error('Bank Account category not found');

    const bankCategoryId = bankCategory.id;

    // 1) Insert the main transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .insert({
        date: input.date,
        paid_to: input.paid_to,
        description: input.description,
        total_amount: input.total_amount,
        created_by: user.id,
      })
      .select()
      .single();
    if (transactionError) throw transactionError;

    // 2) Insert the splits
    const { error: splitsError } = await supabaseAdmin
      .from('demo_treasury_transaction_splits')
      .insert(
        input.splits.map((split) => ({
          transaction_id: transaction.id,
          category_id: split.category_id,
          amount: split.amount,
        }))
      );
    if (splitsError) throw splitsError;

    // 3) Insert ledger entries
    const ledgerEntries = input.splits.flatMap((split) => {
      if (input.type === 'receipt') {
        return [
          {
            transaction_id: transaction.id,
            category_id: split.category_id,
            debit: 0,
            credit: split.amount,
          },
          {
            transaction_id: transaction.id,
            category_id: bankCategoryId,
            debit: split.amount,
            credit: 0,
          },
        ];
      } else {
        return [
          {
            transaction_id: transaction.id,
            category_id: split.category_id,
            debit: split.amount,
            credit: 0,
          },
          {
            transaction_id: transaction.id,
            category_id: bankCategoryId,
            debit: 0,
            credit: split.amount,
          },
        ];
      }
    });

    if (ledgerEntries.length > 0) {
      const { error: ledgerError } = await supabaseAdmin
        .from('demo_treasury_ledger_entries')
        .insert(ledgerEntries);
      if (ledgerError) throw ledgerError;
    }

    revalidateAllPaths();
    return { success: true, data: transaction };
  } catch (err) {
    console.error('Error creating transaction:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 1.5) UPDATE TRANSACTION
// --------------------------------------------------------
export async function updateTransaction(
  transactionId: string,
  input: TransactionCreateInput
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // Get the bank category ID
    const { data: bankCategory, error: bankCategoryError } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id')
      .eq('name', 'Bank Account')
      .single();

    if (bankCategoryError) throw bankCategoryError;
    if (!bankCategory) throw new Error('Bank Account category not found');

    const bankCategoryId = bankCategory.id;

    // Get original transaction
    const { data: originalTx, error: fetchError } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .select('*, history:demo_treasury_transaction_history(*)')
      .eq('id', transactionId)
      .single();

    if (fetchError) throw fetchError;

    // Check if date is changing
    const originalDate = new Date(originalTx.date);
    const newDate = new Date(input.date);

    if (!isDateInMonth(originalDate, newDate)) {
      // Record the date change
      await recordTransactionDateChange({
        originalDate,
        newDate,
        transactionId,
        userId: user.id,
      });
    }

    // Update main transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .update({
        date: input.date,
        paid_to: input.paid_to,
        description: input.description,
        total_amount: input.total_amount,
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update splits
    await supabaseAdmin
      .from('demo_treasury_transaction_splits')
      .delete()
      .eq('transaction_id', transactionId);

    const { error: splitsError } = await supabaseAdmin
      .from('demo_treasury_transaction_splits')
      .insert(
        input.splits.map((split) => ({
          transaction_id: transactionId,
          category_id: split.category_id,
          amount: split.amount,
        }))
      );
    if (splitsError) throw splitsError;

    // Update ledger entries
    await supabaseAdmin
      .from('demo_treasury_ledger_entries')
      .delete()
      .eq('transaction_id', transactionId);

    const ledgerEntries = input.splits.flatMap((split) => {
      if (input.type === 'receipt') {
        return [
          {
            transaction_id: transactionId,
            category_id: split.category_id,
            debit: 0,
            credit: split.amount,
          },
          {
            transaction_id: transactionId,
            category_id: bankCategoryId,
            debit: split.amount,
            credit: 0,
          },
        ];
      } else {
        return [
          {
            transaction_id: transactionId,
            category_id: split.category_id,
            debit: split.amount,
            credit: 0,
          },
          {
            transaction_id: transactionId,
            category_id: bankCategoryId,
            debit: 0,
            credit: split.amount,
          },
        ];
      }
    });

    if (ledgerEntries.length > 0) {
      const { error: ledgerError } = await supabaseAdmin
        .from('demo_treasury_ledger_entries')
        .insert(ledgerEntries);
      if (ledgerError) throw ledgerError;
    }

    revalidateAllPaths();
    return { success: true, data: transaction };
  } catch (err) {
    console.error('Error updating transaction:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 2) DELETE TRANSACTION
// --------------------------------------------------------
export async function deleteTransaction(transactionId: string) {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // First delete related records (splits and ledger entries will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    revalidateAllPaths();
    return { success: true };
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 2.5) DELETE ALL TRANSACTIONS IN MONTH
// --------------------------------------------------------
export async function deleteAllTransactionsInMonth(month: Date) {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const startOfMonth = new Date(
      Date.UTC(month.getFullYear(), month.getMonth(), 1)
    );
    const endOfMonth = new Date(
      Date.UTC(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    );

    // Get transactions using proper PostgREST syntax
    const { data: transactions } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .select('id, date')
      .or(
        `date.gte.${startOfMonth.toISOString()},date.lte.${endOfMonth.toISOString()}`
      );

    if (!transactions) return { success: true };

    // Filter to only delete transactions that belong to this month
    const transactionsToDelete = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return isDateInMonth(txDate, month);
    });

    if (transactionsToDelete.length > 0) {
      const { error } = await supabaseAdmin
        .from('demo_treasury_transactions')
        .delete()
        .in(
          'id',
          transactionsToDelete.map((t) => t.id)
        );

      if (error) throw error;
    }

    revalidateAllPaths();
    return { success: true };
  } catch (err) {
    console.error('Error deleting all transactions:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 3) GET MONTH TRANSACTIONS
// --------------------------------------------------------
export async function getMonthTransactions(month: Date) {
  try {
    if (!(month instanceof Date) || isNaN(month.getTime())) {
      throw new Error('Invalid date provided');
    }

    const startOfMonth = new Date(
      Date.UTC(month.getFullYear(), month.getMonth(), 1)
    );
    const endOfMonth = new Date(
      Date.UTC(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999)
    );

    // Get all transactions that might belong to this month using proper PostgREST syntax
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .select(
        `
        *,
        splits:demo_treasury_transaction_splits(*, category:demo_treasury_categories(*)),
        created_by_user:demo_profiles!fk_demo_treasury_transactions_creator(email, full_name),
        reconciled_by_user:demo_profiles!fk_demo_treasury_transactions_reconciler(email, full_name),
        history:demo_treasury_transaction_history(*)
      `
      )
      .or(
        `date.gte.${startOfMonth.toISOString()},date.lte.${endOfMonth.toISOString()}`
      )
      .order('date', { ascending: true });

    if (error) throw error;

    // Filter transactions to only include those that currently belong to this month
    const filteredData = (data as TransactionWithHistory[]).filter((tx) => {
      const txDate = new Date(tx.date);
      return isDateInMonth(txDate, month);
    });

    return { success: true, data: filteredData };
  } catch (err) {
    console.error('Error fetching month transactions:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
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

// --------------------------------------------------------
// 5) RECONCILE TRANSACTION
// --------------------------------------------------------
export async function reconcileTransaction(
  transactionId: string,
  isReconciled: boolean
) {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .update({
        is_reconciled: isReconciled,
        reconciled_by: isReconciled ? user.id : null,
        reconciled_at: isReconciled ? new Date().toISOString() : null,
      })
      .eq('id', transactionId);

    if (error) throw error;
    revalidateAllPaths();

    return { success: true };
  } catch (err) {
    console.error('Error reconciling transaction:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 6) UPSERT MONTHLY BALANCE
// --------------------------------------------------------
// Modified upsertMonthlyBalance function
export async function upsertMonthlyBalance(input: MonthlyBalanceCreateInput) {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // 'month' stored as "YYYY-MM"
    const monthStr = input.month.toISOString().slice(0, 7);

    // First, check if there's an existing record for this month
    const { data: existingBalance, error: fetchError } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .select('id, is_reconciled')
      .eq('month', monthStr)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // If there's an existing unreconciled record, delete it first
    if (existingBalance && !existingBalance.is_reconciled) {
      const { error: deleteError } = await supabaseAdmin
        .from('demo_treasury_monthly_balances')
        .delete()
        .eq('id', existingBalance.id);

      if (deleteError) throw deleteError;
    }

    // Ensure dates are in ISO format for the database
    const openingDate = input.opening_date
      ? input.opening_date instanceof Date
        ? input.opening_date.toISOString()
        : new Date(input.opening_date).toISOString()
      : new Date(
          Date.UTC(input.month.getFullYear(), input.month.getMonth(), 1)
        ).toISOString();

    const closingDate = input.closing_date
      ? input.closing_date instanceof Date
        ? input.closing_date.toISOString()
        : new Date(input.closing_date).toISOString()
      : new Date(
          Date.UTC(input.month.getFullYear(), input.month.getMonth() + 1, 0)
        ).toISOString();

    // Now perform the insert with properly formatted dates
    const { error: insertError } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .insert({
        month: monthStr,
        opening_balance: input.opening_balance,
        closing_balance: input.closing_balance,
        total_income: input.total_income,
        total_expenses: input.total_expenses,
        is_reconciled: input.is_reconciled ?? false,
        reconciled_by: input.is_reconciled ? user.id : null,
        reconciled_at: input.is_reconciled ? new Date().toISOString() : null,
        opening_date: openingDate,
        closing_date: closingDate,
      });

    if (insertError) throw insertError;

    revalidateAllPaths();
    return { success: true };
  } catch (err) {
    console.error('Error upserting monthly balance:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 7) GET MONTHLY BALANCE
// --------------------------------------------------------
/**
 * Return a MonthlyBalance object from the DB if it exists,
 * or create a "default" row in memory if none.
 * Also compute has_prev_closing for the client to know whether
 * to disable editing of the opening balance.
 */
export async function getMonthlyBalance(month: Date) {
  try {
    if (!(month instanceof Date) || isNaN(month.getTime())) {
      throw new Error('Invalid date provided');
    }
    // Format the month as "YYYY-MM"
    const monthStr = month.toISOString().slice(0, 7);

    // Try to fetch an existing monthly balance record for this month
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .select('*')
      .eq('month', monthStr)
      .single();

    if (data) {
      // If found, check if the previous month was reconciled and had a closing balance
      const prevMonth = new Date(
        Date.UTC(month.getFullYear(), month.getMonth() - 1, 1)
      );
      const prevStr = prevMonth.toISOString().slice(0, 7);

      const { data: prevData } = await supabaseAdmin
        .from('demo_treasury_monthly_balances')
        .select('closing_balance, is_reconciled')
        .eq('month', prevStr)
        .single();

      const hasPrevClosing =
        prevData?.is_reconciled === true &&
        typeof prevData.closing_balance === 'number';

      return {
        success: true,
        data: {
          ...data,
          has_prev_closing: hasPrevClosing,
        },
      };
    }

    // If no record exists, build a new one in memory.
    // Use UTC-based dates for consistency.
    const prevMonth = new Date(
      Date.UTC(month.getFullYear(), month.getMonth() - 1, 1)
    );
    const prevStr = prevMonth.toISOString().slice(0, 7);

    // Try to fetch the previous month's balance
    const { data: prevBal } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .select('closing_balance, is_reconciled, closing_date')
      .eq('month', prevStr)
      .single();

    // Set default opening date to the first day of the current month (UTC)
    let defaultOpeningDate = new Date(
      Date.UTC(month.getFullYear(), month.getMonth(), 1)
    );
    let opening = 0;
    let hasPrevClosing = false;

    if (prevBal && prevBal.is_reconciled === true && prevBal.closing_date) {
      // Parse the previous month's closing date (assumed stored in YYYY-MM-DD format)
      const prevClose = new Date(prevBal.closing_date);
      // Create a new UTC date that is one day after the previous closing date
      defaultOpeningDate = new Date(
        Date.UTC(
          prevClose.getUTCFullYear(),
          prevClose.getUTCMonth(),
          prevClose.getUTCDate() + 1
        )
      );
      opening = prevBal.closing_balance;
      hasPrevClosing = true;
    }

    return {
      success: true,
      data: {
        id: null,
        month: monthStr,
        opening_balance: opening,
        closing_balance: 0,
        total_income: 0,
        total_expenses: 0,
        is_reconciled: false,
        reconciled_by: null,
        reconciled_at: null,
        created_at: null,
        updated_at: null,
        // Use our computed defaultOpeningDate
        opening_date: defaultOpeningDate,
        // For the default closing date, compute the last day of the month in UTC
        closing_date: new Date(
          Date.UTC(month.getFullYear(), month.getMonth() + 1, 0)
        ),
        has_prev_closing: hasPrevClosing,
      },
    };
  } catch (err) {
    console.error('Error getting monthly balance:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 8) LIST RECONCILED MONTHS
// --------------------------------------------------------
export async function listReconciledMonths() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .select('*')
      .eq('is_reconciled', true)
      // Instead of .order('closing_date'), we order by "month" descending:
      .order('month', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error listing reconciled months:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listPastReconciliations() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .select(
        `
        *,
        reconciled_by_user:demo_profiles!fk_demo_treasury_monthly_balances_reconciler(email, full_name)
      `
      )
      .eq('is_reconciled', true)
      .order('month', { ascending: false }); // Order by month instead of closing_date

    if (error) throw error;

    // Add additional validation to ensure we only return properly reconciled records
    const validReconciliations =
      data?.filter(
        (rec) =>
          rec.is_reconciled === true &&
          rec.reconciled_at &&
          rec.closing_balance !== null
      ) ?? [];

    return { success: true, data: validReconciliations };
  } catch (err) {
    console.error('Error listing past reconciliations:', err);
    return { success: false, error: String(err) };
  }
}

// --------------------------------------------------------
// 9) GET LATEST RECONCILED BALANCE
// --------------------------------------------------------
export async function getLatestReconciledBalance() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .select('*')
      .eq('is_reconciled', true)
      .order('closing_date', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    if (error) throw error;
    return { success: true, data: data || null };
  } catch (err) {
    console.error('Error fetching latest reconciled balance:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 10) DELETE MONTHLY BALANCE (NEW)
// --------------------------------------------------------
/**
 * Fully deletes a monthly balance row by ID.
 * Returns { success:true, deletedCount:number } if it works.
 */

export async function deleteMonthlyBalance(monthlyBalanceId: string) {
  console.log('deleteMonthlyBalance: called with ID=', monthlyBalanceId);

  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_balances')
      .delete()
      .eq('id', monthlyBalanceId)
      .select('*'); // returns the actual rows deleted

    if (error) {
      console.error('deleteMonthlyBalance: DB error =>', error);
      throw error;
    }

    const deletedCount = data ? data.length : 0;
    console.log(
      `deleteMonthlyBalance: deleted row count = ${deletedCount}`,
      data
    );

    revalidateAllPaths();
    return { success: true, deletedCount };
  } catch (err) {
    console.error('deleteMonthlyBalance: caught error =>', err);
    return { success: false, error: String(err) };
  }
}

// Add to bookkeeping-actions.ts

// Get draft values for a month
export async function getMonthlyDraft(month: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_monthly_drafts')
      .select('*')
      .eq('month', month)
      .single();
    if (error && error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error getting monthly draft:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Update draft values for a month
export async function updateMonthlyDraft(input: MonthlyDraftInput) {
  try {
    const { error } = await supabaseAdmin
      .from('demo_treasury_monthly_drafts')
      .upsert({
        month: input.month,
        closing_balance: input.closing_balance,
        closing_date: input.closing_date,
      });
    if (error) throw error;
    revalidateAllPaths();
    return { success: true };
  } catch (err) {
    console.error('Error updating monthly draft:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Clear draft when reconciliation is complete
export async function clearMonthlyDraft(month: string) {
  try {
    const { error } = await supabaseAdmin
      .from('demo_treasury_monthly_drafts')
      .delete()
      .eq('month', month);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error clearing monthly draft:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// bookkeeping-actions.ts (snippet)

export async function getAllReconciledTransactions() {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .select(
        `
          *,
          splits:demo_treasury_transaction_splits(*, category:demo_treasury_categories(*)),
          created_by_user:demo_profiles!fk_demo_treasury_transactions_creator(email, full_name),
          reconciled_by_user:demo_profiles!fk_demo_treasury_transactions_reconciler(email, full_name)
        `
      )
      .eq('is_reconciled', true)
      .order('date', { ascending: true });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error fetching all reconciled transactions:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// 5.5) RECONCILE ALL TRANSACTIONS IN MONTH
// --------------------------------------------------------
export async function reconcileAllTransactionsInMonth(month: Date) {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const { error } = await supabaseAdmin
      .from('demo_treasury_transactions')
      .update({
        is_reconciled: true,
        reconciled_by: user.id,
        reconciled_at: new Date().toISOString(),
      })
      .gte('date', startOfMonth.toISOString())
      .lte('date', endOfMonth.toISOString())
      .eq('is_reconciled', false);
    if (error) throw error;
    revalidateAllPaths();
    return { success: true };
  } catch (err) {
    console.error('Error reconciling all transactions:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listAllReconciledTransactions(year?: number) {
  try {
    let query = supabaseAdmin
      .from('demo_treasury_transactions')
      .select(
        `
        *,
        splits:demo_treasury_transaction_splits(*, category:demo_treasury_categories(*)),
        created_by_user:demo_profiles!fk_demo_treasury_transactions_creator(email, full_name),
        reconciled_by_user:demo_profiles!fk_demo_treasury_transactions_reconciler(email, full_name)
      `
      )
      .eq('is_reconciled', true)
      .order('date', { ascending: false });

    if (year) {
      const startOfYear = new Date(year, 0, 1).toISOString();
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();
      query = query.gte('date', startOfYear).lte('date', endOfYear);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data } as {
      success: boolean;
      data: TreasuryTransaction[];
    };
  } catch (err) {
    console.error('Error fetching reconciled transactions:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// GET ALL TRANSACTIONS
// --------------------------------------------------------
export async function getAllTransactions(): Promise<
  | { success: true; data: TreasuryTransaction[] }
  | { success: false; error: string }
> {
  try {
    let query = supabaseAdmin
      .from('demo_treasury_transactions')
      .select(
        `
        *,
        splits:demo_treasury_transaction_splits(*, category:demo_treasury_categories(*)),
        created_by_user:demo_profiles!fk_demo_treasury_transactions_creator(email, full_name),
        reconciled_by_user:demo_profiles!fk_demo_treasury_transactions_reconciler(email, full_name)
      `
      )
      .order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data } as {
      success: true;
      data: TreasuryTransaction[];
    };
  } catch (err) {
    console.error('Error fetching all transactions:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// CREATE CATEGORY
// --------------------------------------------------------
export async function createCategory(input: {
  name: string;
  description?: string;
  is_expense: boolean;
}): Promise<ActionResponse<TreasuryCategory>> {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // Check if category with same name exists (case insensitive)
    const { data: existing } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id')
      .ilike('name', input.name)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'A category with this name already exists',
      };
    }

    const { data, error } = await supabaseAdmin
      .from('demo_treasury_categories')
      .insert({
        name: input.name,
        description: input.description,
        is_expense: input.is_expense,
      })
      .select()
      .single();

    if (error) throw error;

    revalidateAllPaths();
    return { success: true, data };
  } catch (err) {
    console.error('Error creating category:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// DELETE CATEGORY
// --------------------------------------------------------
export async function deleteCategory(
  categoryId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // Check if category is used in any splits
    const { data: splits } = await supabaseAdmin
      .from('demo_treasury_transaction_splits')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (splits && splits.length > 0) {
      return {
        success: false,
        error: 'Cannot delete category that is used in transactions',
      };
    }

    // Check if category is used in any budgets
    const { data: budgets } = await supabaseAdmin
      .from('demo_treasury_annual_budgets')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (budgets && budgets.length > 0) {
      return {
        success: false,
        error: 'Cannot delete category that is used in budgets',
      };
    }

    const { error } = await supabaseAdmin
      .from('demo_treasury_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    revalidateAllPaths();
    return { success: true, data: { id: categoryId } };
  } catch (err) {
    console.error('Error deleting category:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// CATEGORY PATTERN MANAGEMENT
// --------------------------------------------------------

export async function createCategoryPattern(
  input: CategoryPatternCreateInput
): Promise<ActionResponse<CategoryPattern>> {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    // Check if pattern already exists
    const { data: existing } = await supabaseAdmin
      .from('demo_treasury_category_patterns')
      .select('id')
      .ilike('pattern', input.pattern)
      .single();

    if (existing) {
      return {
        success: false,
        error: 'A pattern with this text already exists',
      };
    }

    const { data, error } = await supabaseAdmin
      .from('demo_treasury_category_patterns')
      .insert({
        pattern: input.pattern,
        name: input.name,
        description: input.description,
        is_expense: input.is_expense,
        match_count: 0,
        confidence_score: 1.0,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error creating category pattern:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getCategoryPatterns(): Promise<
  ActionResponse<CategoryPattern[]>
> {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_category_patterns')
      .select('*')
      .order('match_count', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error fetching category patterns:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateCategoryPattern(
  patternId: string,
  updates: Partial<CategoryPatternCreateInput>
): Promise<ActionResponse<CategoryPattern>> {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabaseAdmin
      .from('demo_treasury_category_patterns')
      .update(updates)
      .eq('id', patternId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error updating category pattern:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteCategoryPattern(
  patternId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get the user from supabaseAdmin instead
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabaseAdmin
      .from('demo_treasury_category_patterns')
      .delete()
      .eq('id', patternId);

    if (error) throw error;
    return { success: true, data: { id: patternId } };
  } catch (err) {
    console.error('Error deleting category pattern:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------
// CATEGORY PATTERN LEARNING
// --------------------------------------------------------

export async function incrementPatternMatch(
  patternId: string
): Promise<ActionResponse<CategoryPattern>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('demo_treasury_category_patterns')
      .update({
        match_count: supabaseAdmin.rpc('increment'),
        confidence_score: supabaseAdmin.rpc('calculate_confidence_score'),
      })
      .eq('id', patternId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Error incrementing pattern match:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
