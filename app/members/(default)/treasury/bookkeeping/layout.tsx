// app/members/(default)/treasury/bookkeeping/layout.tsx
import { getLatestReconciledBalance } from '@/app/members/actions/treasury/bookkeeping-actions';
import MonthlyOverviewCard from './monthly-overview-card';
import BookkeepingLayoutClient from './bookkeeping-layout-client';

export default async function BookkeepingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // fetch the *latest* reconciled data
  const { data: latestReconciled } = await getLatestReconciledBalance();

  return (
    <div className="sm:space-y-4 space-y-2 pb-6">
      <MonthlyOverviewCard
        latestReconciled={latestReconciled}
        // no link to bookkeeping, since we’re already in Bookkeeping
        showLinkToBookkeeping={false}
      />
      <BookkeepingLayoutClient>{children}</BookkeepingLayoutClient>
    </div>
  );
}
