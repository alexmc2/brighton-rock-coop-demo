'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/members/ui/tabs';

/**
 * Map specific paths => which top-level tab is highlighted
 * Adjust if your paths differ (e.g. add /members/treasury/bookkeeping/*).
 */
const topTabPaths = {
  '/members/treasury': 'bookkeeping',
  '/members/treasury/bookkeeping/bank-reconciliation': 'bookkeeping',
  '/members/treasury/accounts': 'accounts',
  '/members/treasury/budgets': 'budgets',
  '/members/treasury/budgets/overview': 'budgets',
  '/members/treasury/budgets/budget-proposals': 'budgets',
  '/members/treasury/budgets/anomalies': 'budgets',
  '/members/treasury/expenses': 'expenses',
};

export default function TreasuryLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Normalize the pathname (remove a trailing slash if present)
  const normalizedPathname =
    pathname && pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;

  // Simple path-based check
  let currentTab = 'bookkeeping';

  // Check for budgets first since it's the problematic one
  if (normalizedPathname.includes('/treasury/budgets')) {
    currentTab = 'budgets';
  } else if (normalizedPathname.includes('/treasury/accounts')) {
    currentTab = 'accounts';
  } else if (normalizedPathname.includes('/treasury/expenses')) {
    currentTab = 'expenses';
  }

  return (
    <Tabs
      defaultValue={currentTab}
      value={currentTab}
      className="sm:space-y-4 space-y-2"
    >
      {/* The top-level tabs row */}
      <div>
        <TabsList className="w-full h-full grid grid-cols-4 sm:grid-cols-4 gap-1.5">
          <TabsTrigger
            value="bookkeeping"
            className="text-center text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
            asChild
          >
            <Link href="/members/treasury">
              {/* Mobile label */}
              <span className="block sm:hidden">Books</span>
              {/* Desktop label */}
              <span className="hidden sm:block">Monthly Bookkeeping</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            className="text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
            asChild
          >
            <Link href="/members/treasury/accounts">
              <span className="block sm:hidden">Accounts</span>
              <span className="hidden sm:block">Annual Accounts</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="budgets"
            className="text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
            asChild
          >
            <Link href="/members/treasury/budgets/overview">
              <span className="block sm:hidden">Budgets</span>
              <span className="hidden sm:block">Budgets</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="text-sm whitespace-normal h-10 px-2 py-0.5 data-[state=active]:text-white"
            asChild
          >
            <Link href="/members/treasury/expenses">
              <span className="block sm:hidden">Expenses</span>
              <span className="hidden sm:block">Expense Claims</span>
            </Link>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* The child route content */}
      <div className="relative mt-6">
        <TabsContent
          value={currentTab}
          className="absolute inset-0 w-full transition-opacity duration-300"
          style={{ opacity: 1, height: '100%', minHeight: '600px' }}
          forceMount
        >
          {children}
        </TabsContent>
      </div>
    </Tabs>
  );
}
