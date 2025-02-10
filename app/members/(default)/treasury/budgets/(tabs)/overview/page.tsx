// app/members/(default)/treasury/budgets/(tabs)/overview/page.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  getAgreedBudgetForYear,
  getDetailedTransactionReport,
  type TransactionSplit,
} from '@/app/members/actions/treasury/budget-actions';

import BudgetOverviewClient from './budget-overview';

export const dynamic = 'force-dynamic';

function getCurrentFiscalYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  return now.getMonth() < 3 ? currentYear : currentYear + 1;
}

export default async function BudgetOverviewPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string };
}) {
  // 1) parse ?year= and ?month=, fallback to current fiscal year
  let fiscalYear: number;
  let selectedMonth: number | undefined;

  if (searchParams?.year) {
    const parsed = parseInt(searchParams.year, 10);
    if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2100) {
      fiscalYear = parsed;
    } else {
      return notFound();
    }
  } else {
    fiscalYear = getCurrentFiscalYear();
  }

  // Parse month if provided
  if (searchParams?.month) {
    const parsed = parseInt(searchParams.month, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      selectedMonth = parsed;
    }
  }

  // 2) Fetch the final agreed budget lines + actual totals
  const [agreedRes, transactionRes] = await Promise.all([
    getAgreedBudgetForYear(fiscalYear),
    getDetailedTransactionReport(
      fiscalYear,
      selectedMonth ? String(selectedMonth) : undefined
    ),
  ]);

  if (!agreedRes.success || !transactionRes.success) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <BudgetOverviewClient
          items={[]}
          initialYear={fiscalYear}
          error="Error loading budget or spending data."
          selectedMonth={selectedMonth}
        />
      </Suspense>
    );
  }

  const agreedRows = agreedRes.data || [];
  const transactions = transactionRes.data.transactions;

  // Get all unique category IDs from both agreed budget and transactions
  const categoryIds = new Set([
    ...agreedRows.map((row) => row.category_id),
    ...transactions.map((tx) => tx.category_id),
  ]);

  // 3) Build the array for the table: income + expense categories
  const items = Array.from(categoryIds).map((categoryId) => {
    // Find the budget row for this category
    const budgetRow = agreedRows.find((row) => row.category_id === categoryId);

    // Get the transactions for this category
    const categoryTransactions = transactions.filter(
      (tx) => tx.category_id === categoryId
    );
    const spentAmt = categoryTransactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    // If we have a budget row, use its details
    if (budgetRow) {
      return {
        categoryId,
        categoryName: budgetRow.category?.name || 'Unknown',
        isExpense: !!budgetRow.category?.is_expense,
        budget: Number(budgetRow.annual_budget || 0),
        spent: spentAmt,
        transactions: categoryTransactions,
      };
    }

    // For categories that only have actuals but no budget
    const firstTransaction = categoryTransactions[0];
    if (firstTransaction) {
      return {
        categoryId,
        categoryName: firstTransaction.category_name,
        isExpense: firstTransaction.is_expense,
        budget: 0,
        spent: spentAmt,
        transactions: categoryTransactions,
      };
    }

    // Fallback for unknown categories
    return {
      categoryId,
      categoryName: 'Unknown Category',
      isExpense: true,
      budget: 0,
      spent: spentAmt,
      transactions: [],
    };
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BudgetOverviewClient
        items={items}
        initialYear={fiscalYear}
        selectedMonth={selectedMonth}
        warning={
          !agreedRows.length
            ? `No budget agreed for ${fiscalYear}. Go to Proposals to add one.`
            : undefined
        }
      />
    </Suspense>
  );
}
