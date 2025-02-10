// app/members/(default)/treasury/budgets/layout.tsx

import { notFound } from 'next/navigation';
import BudgetsProvider from './budgets-provider';
import BudgetsLayoutClient from './budgets-layout-client';

/**
 * Calculate the current fiscal year.
 * If we're between Jan-Mar, we're in fiscal year ending that year
 * If we're between Apr-Dec, we're in fiscal year ending next year
 */
function getCurrentFiscalYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  // If we're in Jan-Mar, we're in the fiscal year ending this year
  // If we're in Apr-Dec, we're in the fiscal year ending next year
  return now.getMonth() < 3 ? currentYear : currentYear + 1;
}

export default function BudgetsLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: { [key: string]: string };
}) {
  // If year is in URL, use that, otherwise use current fiscal year
  let year = getCurrentFiscalYear();

  if (searchParams?.year) {
    const parsed = parseInt(searchParams.year, 10);
    if (!isNaN(parsed)) {
      year = parsed;
    }
  }

  // Basic guard
  if (year < 2000 || year > 2100) {
    return notFound();
  }

  return (
    <div className="pb-6">
      {/* 
        1) Provide the year in a context so children can share selectedYear
        2) Also provide the tab layout so we see "Overview | Proposals | ..." 
      */}
      <BudgetsProvider initialYear={year}>
        <BudgetsLayoutClient year={year}>{children}</BudgetsLayoutClient>
      </BudgetsProvider>
    </div>
  );
}
