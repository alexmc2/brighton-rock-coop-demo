// app/members/(default)/treasury/bookkeeping/report/[month]/page.tsx

import {
  getMonthlyBalance,
  getMonthTransactions,
} from '@/app/members/actions/treasury/bookkeeping-actions';
import type {
  MonthlyBalance,
  TreasuryTransaction,
} from '@/types/members/treasury';

export default async function ReconciliationReportPage({
  params,
}: {
  params: { month: string };
}) {
  // Ensure the month parameter is provided
  const { month } = params;
  if (!month) {
    return (
      <div className="text-red-500">
        Error: Missing month parameter. Please use YYYY-MM format.
      </div>
    );
  }

  try {
    // Convert "YYYY-MM" to Date, ensuring we create a valid date
    const [year, monthNum] = month.split('-').map(Number);
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('Invalid month format');
    }

    // Create date at noon to avoid timezone issues
    const dateObj = new Date(year, monthNum - 1, 1, 12, 0, 0, 0);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    const formatCurrency = (num: number) =>
      num.toLocaleString('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const formatDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      });
    };

    const balRes = (await getMonthlyBalance(dateObj)) as {
      success: boolean;
      data?: MonthlyBalance;
    };
    const txRes = (await getMonthTransactions(dateObj)) as {
      success: boolean;
      data?: TreasuryTransaction[];
    };

    const balance: MonthlyBalance | null =
      balRes.success && balRes.data ? balRes.data : null;
    const transactions: TreasuryTransaction[] =
      txRes.success && txRes.data ? txRes.data : [];

    // If not found, show some fallback
    if (!balance) {
      return <div>No data for {month}</div>;
    }

    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold mb-4">
          Bank Reconciliation Report - {month}
        </h1>
        <div>Opening Balance: £{formatCurrency(balance.opening_balance)}</div>
        <div>Closing Balance: £{formatCurrency(balance.closing_balance)}</div>
        <div>Total Income: £{formatCurrency(balance.total_income)}</div>
        <div>Total Expenses: £{formatCurrency(balance.total_expenses)}</div>
        {/* ... any other info ... */}
        <hr />

        <h2 className="text-lg font-semibold mt-6">Transactions</h2>
        <ul className="list-disc ml-5">
          {transactions.map((tx) => (
            <li key={tx.id}>
              {formatDate(tx.date)} - {tx.paid_to} - £
              {formatCurrency(tx.total_amount)}
              {/* Show splits if needed */}
            </li>
          ))}
        </ul>
      </div>
    );
  } catch (error) {
    console.error('Error in ReconciliationReportPage:', error);
    return (
      <div className="text-red-500">
        Error: Invalid month format or date. Please use YYYY-MM format.
      </div>
    );
  }
}
