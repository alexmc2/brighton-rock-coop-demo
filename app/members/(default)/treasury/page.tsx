// app/members/(default)/treasury/page.tsx

import { Metadata } from 'next';
import { TabsContent } from '@/components/members/ui/tabs';

import {
  getCategories,
  getLatestReconciledBalance,
  listReconciledMonths,
} from '@/app/members/actions/treasury/bookkeeping-actions';
import MonthlyOverviewCard from './bookkeeping/monthly-overview-card';
import AnnualAccounts from './accounts/annual-accounts';
import ExpenseClaims from './expenses/expense-claims';
import BudgetOverviewPage from './budgets/(tabs)/overview/page';

export const metadata: Metadata = {
  title: 'Treasury - Brighton Rock Housing Co-op',
  description: 'Manage co-op finances and budgeting',
};

export const dynamic = 'force-dynamic';

export default async function TreasuryPage() {
  // Optionally, fetch categories if needed in other parts of your page
  await getCategories();

  // Fetch all reconciled months and limit to the last 12.
  const reconciliationsResponse = await listReconciledMonths();
  // Ensure we work with an array and take the first 12 (they are ordered descending)
  const reconciliations =
    reconciliationsResponse.success && reconciliationsResponse.data
      ? reconciliationsResponse.data.slice(0, 4)
      : [];

  return (
    <>
      <TabsContent value="bookkeeping">
        <div className="pb-6 sm:space-y-4 space-y-2">
          {reconciliations.length > 0 ? (
            reconciliations.map((recon, idx) => (
              <MonthlyOverviewCard
                key={recon.id}
                latestReconciled={recon}
                showLinkToBookkeeping={idx === 0} // Only the first (latest) gets the booking link
              />
            ))
          ) : (
            <MonthlyOverviewCard showLinkToBookkeeping={true} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="accounts">
        <AnnualAccounts />
      </TabsContent>

      <TabsContent value="budgets">
        <BudgetOverviewPage />
      </TabsContent>

      <TabsContent value="expenses">
        <ExpenseClaims />
      </TabsContent>
    </>
  );
}
