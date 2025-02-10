// app/members/(default)/treasury/bookkeeping/(tabs)/transactions/page.tsx
import { Metadata } from 'next';
import {
  getAllTransactions,
  getCategories,
} from '@/app/members/actions/treasury/bookkeeping-actions';
import AllTransactionsPanel from './all-transactions-panel';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/members/ui/loading-spinner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Bookkeeping – All Transactions',
};

export default async function ReconciledTransactionsPage() {
  const [transactionsResult, categoriesResult] = await Promise.all([
    getAllTransactions(),
    getCategories(),
  ]);

  if (!transactionsResult.success || !categoriesResult.success) {
    return <div>Error loading data</div>;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AllTransactionsPanel
        initialTransactions={transactionsResult.data}
        categories={categoriesResult.data}
      />
    </Suspense>
  );
}
