// app/members/(default)/treasury/bookkeeping/_client-views/monthly-overview-card.tsx
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/members/ui/card';
import type { MonthlyBalance } from '@/types/members/treasury';

interface Props {
  latestReconciled?: MonthlyBalance;
  /** If true, show a link to `/members/treasury/bookkeeping`. */
  showLinkToBookkeeping?: boolean;
}

/**
 * SERVER COMPONENT — purely for display.
 */
export default function MonthlyOverviewCard({
  latestReconciled,
  showLinkToBookkeeping = false,
}: Props) {
  // Define a constant for the card border classes
  const cardBorderClasses =
    'border-3 border-coop-200/80 dark:border-sky-500/50 ';

  if (!latestReconciled) {
    return (
      <Card className={cardBorderClasses}>
        <CardHeader>
          <CardTitle className="text-slate-600 dark:text-slate-100">
            No Reconciliations Yet
          </CardTitle>
        </CardHeader>
        <CardDescription className="text-sm text-slate-500 dark:text-slate-300 mb-4 ml-6">
          Please reconcile the bank account to see the monthly overview.
        </CardDescription>
        <CardContent>
          {showLinkToBookkeeping && (
            <Link
              href="/members/treasury/bookkeeping/bank-reconciliation"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors dark:bg-sky-600 bg-coop-500 text-slate-100 hover:bg-coop-600 dark:hover:bg-sky-700 rounded-md"
            >
              Reconcile Bank
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  // Format numbers with commas and 2 decimal places
  const formatCurrency = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const opening = formatCurrency(latestReconciled.opening_balance || 0);
  const closing = formatCurrency(latestReconciled.closing_balance || 0);
  const inc = formatCurrency(latestReconciled.total_income || 0);
  const exp = formatCurrency(latestReconciled.total_expenses || 0);

  const openDate = latestReconciled.opening_date
    ? new Date(latestReconciled.opening_date)
    : null;
  const closeDate = latestReconciled.closing_date
    ? new Date(latestReconciled.closing_date)
    : null;

  // Create URL-friendly date string for the reconciliation link
  let monthForUrl: string | null = null;

  if (latestReconciled.month) {
    // The month is already in YYYY-MM format in the database, use it directly
    monthForUrl = latestReconciled.month;
  } else if (openDate) {
    // Format the date as YYYY-MM
    const year = openDate.getFullYear();
    const month = String(openDate.getMonth() + 1).padStart(2, '0');
    monthForUrl = `${year}-${month}`;
  }

  const reconciliationUrl = monthForUrl
    ? `/members/treasury/bookkeeping/bank-reconciliation?month=${monthForUrl}`
    : '/members/treasury/bookkeeping/bank-reconciliation';

  // Let's also log the full latestReconciled object to see its structure
  console.log(
    'Full latestReconciled object:',
    JSON.stringify(latestReconciled, null, 2)
  );

  return (
    <Card className={cardBorderClasses}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Link
            href={reconciliationUrl}
            className="hover:text-coop-500 dark:hover:text-sky-500"
          >
            <CardTitle className="text-md font-semibold">
              {openDate
                ? openDate.toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  }) + ' Bank Reconciliation'
                : 'Bank Reconciliation'}
            </CardTitle>
          </Link>
          {showLinkToBookkeeping && (
            <Link
              href="/members/treasury/bookkeeping/bank-reconciliation"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors bg-coop-500 dark:bg-sky-600 text-white hover:bg-coop-600 dark:hover:bg-sky-700 rounded-md"
            >
              Reconcile Bank
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Opening Balance
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
              £{opening}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900  rounded-lg">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Total Income
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              +£{inc}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900  rounded-lg">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Total Payments
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              -£{exp}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900  rounded-lg">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Closing Balance
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
              £{closing}
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-slate-500">
          {openDate && closeDate ? (
            <>
              Period from{' '}
              <b>
                {openDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </b>{' '}
              to{' '}
              <b>
                {closeDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </b>
            </>
          ) : (
            <>No date range available.</>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
