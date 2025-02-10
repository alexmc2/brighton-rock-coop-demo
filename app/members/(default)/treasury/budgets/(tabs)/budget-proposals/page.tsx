// app/members/(default)/treasury/budgets/(tabs)/budget-proposals/page.tsx

import { notFound } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardTreasury,
  CardDescription,
} from '@/components/members/ui/card';
import {
  getCategories,
  getBudgetProposalsForYear,
} from '@/app/members/actions/treasury/budget-actions';
import BudgetProposalsClient from './budget-spreadsheet';
import { TreasuryCategory } from '@/types/members/treasury';
import { Suspense } from 'react';
import { Spinner } from '@/components/members/ui/spinner';

export const dynamic = 'force-dynamic';

function getCurrentFiscalYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  return now.getMonth() < 3 ? currentYear : currentYear + 1;
}

export default async function BudgetProposalsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string };
}) {
  // 1) parse ?year=, fallback to current fiscal year
  let year: number;
  if (searchParams?.year) {
    const parsed = parseInt(searchParams.year, 10);
    if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2100) {
      year = parsed;
    } else {
      return notFound();
    }
  } else {
    year = getCurrentFiscalYear();
  }

  // 2) Load categories
  const catRes = await getCategories();
  let expenseCats: TreasuryCategory[] = [];
  if (catRes.success && catRes.data) {
    expenseCats = catRes.data.filter((c) => c.is_expense);
  }

  // 3) Load budget proposals from DB for that year
  const proposalsRes = await getBudgetProposalsForYear(year);
  const existingProposals = proposalsRes.success ? proposalsRes.data ?? [] : [];

  // 4) Render the client spreadsheet
  return (
    <div className="">
      <Suspense fallback={<Spinner />}>
        <BudgetProposalsClient
          fiscalYear={year}
          expenseCategories={expenseCats}
          existingProposals={existingProposals}
        />
      </Suspense>
    </div>
  );
}
