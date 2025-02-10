// app/members/(default)/treasury/bookkeeping/(tabs)/bank-reconciliation/page.tsx

import { Metadata } from 'next';
import { cookies } from 'next/headers';
import type {
  TreasuryCategory,
  TreasuryTransaction,
  MonthlyBalance,
} from '@/types/members/treasury';

import ReconciliationPanel from './reconciliation-panel';

import {
  getCategories,
  getMonthTransactions,
  getMonthlyBalance,
} from '@/app/members/actions/treasury/bookkeeping-actions';

export const metadata: Metadata = {
  title: 'Reconciliation',
};

export const dynamic = 'force-dynamic';

function createDateFromYearMonth(yearMonth: string): Date | null {
  // Validate format YYYY-MM
  const match = yearMonth.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // Convert to 0-based month

  // Validate ranges
  if (year < 2000 || year > 2100 || month < 0 || month > 11) return null;

  const date = new Date(Date.UTC(year, month, 1));
  return date;
}

// SERVER component: fetch data, pass it as "initial" props
export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const cookieStore = cookies();
  const savedMonth = cookieStore.get('treasury-selected-month')?.value;

  // Default to current date
  let selectedMonth = new Date();

  // Try URL param first if it exists
  if (searchParams.month) {
    if (searchParams.month.match(/^\d{4}-\d{2}$/)) {
      // Handle YYYY-MM format
      const parsedDate = createDateFromYearMonth(searchParams.month);
      if (parsedDate) {
        selectedMonth = parsedDate;
      }
    }
  } else if (savedMonth) {
    // If no URL param, try the saved cookie
    const parsedDate = new Date(savedMonth);
    if (!isNaN(parsedDate.getTime())) {
      selectedMonth = parsedDate;
    }
  }

  // selectedMonth is now guaranteed to be a valid Date

  const [catRes, txRes, balRes] = (await Promise.all([
    getCategories(),
    getMonthTransactions(selectedMonth),
    getMonthlyBalance(selectedMonth),
  ])) as [
    { success: boolean; data?: TreasuryCategory[] },
    { success: boolean; data?: TreasuryTransaction[] },
    { success: boolean; data?: MonthlyBalance }
  ];

  const categories = catRes.success ? catRes.data ?? [] : [];
  const transactions = txRes.success ? txRes.data ?? [] : [];
  const monthlyBalance = balRes.success ? balRes.data ?? null : null;

  return (
    <div className="">
      <ReconciliationPanel
        // Pass only data — no event handlers
        initialMonth={selectedMonth}
        initialBalance={monthlyBalance}
        initialTransactions={transactions}
        categories={categories}
      />
    </div>
  );
}
