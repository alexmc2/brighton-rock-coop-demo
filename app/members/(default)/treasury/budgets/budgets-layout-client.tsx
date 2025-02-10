// app/members/(default)/treasury/budgets/budgets-layout-client.tsx

'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import React, { useTransition } from 'react';
import { useSelectedYear } from './budgets-provider';
import {
  Tabs,
  TabsListTreasury,
  TabsTrigger,
  TabsContent,
} from '@/components/members/ui/tabs';

////////////////////////////////////////////////////////////////////////////////
// Tab Mapping
////////////////////////////////////////////////////////////////////////////////

const subTabPaths: Record<string, string> = {
  '/members/treasury/budgets': 'overview',
  '/members/treasury/budgets/overview': 'overview',
  '/members/treasury/budgets/budget-proposals': 'proposals',
  '/members/treasury/budgets/budget-reports': 'budget-reports',
};

////////////////////////////////////////////////////////////////////////////////
// Props
////////////////////////////////////////////////////////////////////////////////

interface BudgetsLayoutClientProps {
  year: number;
  children: React.ReactNode;
}

////////////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////////////

export default function BudgetsLayoutClient({
  year,
  children,
}: BudgetsLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { selectedYear } = useSelectedYear();

  // Determine which sub‐tab is active:
  const currentSubTab = subTabPaths[pathname] || 'overview';

  // Always use the selectedYear from context for navigation
  const currentYear = selectedYear || year;

  return (
    <Tabs value={currentSubTab}>
      <TabsListTreasury className="w-full h-full grid grid-cols-3 sm:grid-cols-3 gap-1.5">
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="overview"
          onClick={() => {
            startTransition(() => {
              router.push(
                `/members/treasury/budgets/overview?year=${currentYear}`
              );
            });
          }}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="proposals"
          onClick={() => {
            startTransition(() => {
              router.push(
                `/members/treasury/budgets/budget-proposals?year=${currentYear}`
              );
            });
          }}
        >
          Proposals
        </TabsTrigger>
        <TabsTrigger
          className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
          value="budget-reports"
          onClick={() => {
            startTransition(() => {
              router.push(
                `/members/treasury/budgets/budget-reports?year=${currentYear}`
              );
            });
          }}
        >
          Reports
        </TabsTrigger>
      </TabsListTreasury>

      <TabsContent value={currentSubTab} className="p-0">
        {children}
      </TabsContent>
    </Tabs>
  );
}
