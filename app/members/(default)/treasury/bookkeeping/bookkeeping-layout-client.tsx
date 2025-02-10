'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Tabs,
  TabsList,
  TabsListTreasury,
  TabsTrigger,
  TabsContent,
} from '@/components/members/ui/tabs';

const subTabPaths = {
  '/members/treasury/bookkeeping/bank-reconciliation': 'bank-reconciliation',
  '/members/treasury/bookkeeping/reconciled-transactions':
    'reconciled-transactions',
  '/members/treasury/bookkeeping/past-reconciliations': 'past-reconciliations',
  '/members/treasury/bookkeeping/monthly-reports': 'monthly-reports',
};

export default function BookkeepingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentSubTab =
    subTabPaths[pathname as keyof typeof subTabPaths] || 'reconciliation';

  return (
    <Tabs value={currentSubTab} className="">
      <TabsListTreasury className="w-full h-full grid grid-cols-4 sm:grid-cols-4 gap-1.5">
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="bank-reconciliation"
          asChild
        >
          <Link href="/members/treasury/bookkeeping/bank-reconciliation">
            <span className="block sm:hidden">Bank</span>
            <span className="hidden sm:block">Bank Reconciliation</span>
          </Link>
        </TabsTrigger>
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="reconciled-transactions"
          asChild
        >
          <Link href="/members/treasury/bookkeeping/reconciled-transactions">
            <span className="block sm:hidden">All</span>
            <span className="hidden sm:block">All Transactions</span>
          </Link>
        </TabsTrigger>
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="past-reconciliations"
          asChild
        >
          <Link href="/members/treasury/bookkeeping/past-reconciliations">
            <span className="block sm:hidden">Past</span>
            <span className="hidden sm:block">Past Reconciliations</span>
          </Link>
        </TabsTrigger>
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="monthly-reports"
          asChild
        >
          <Link href="/members/treasury/bookkeeping/monthly-reports">
            <span className="block sm:hidden">Reports</span>
            <span className="hidden sm:block">Monthly Reports</span>
          </Link>
        </TabsTrigger>
      </TabsListTreasury>

      <TabsContent value={currentSubTab}>{children}</TabsContent>
    </Tabs>
  );
}
