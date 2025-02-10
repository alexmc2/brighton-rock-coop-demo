// app/members/(default)/treasury/bookkeeping/_client-views/monthly-updates-panel.tsx

import React from 'react';
import {
  Card,
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import { Mail } from 'lucide-react';
import type { MonthlyBalance } from '@/types/members/treasury';

interface MonthlyUpdatesPanelProps {
  selectedMonth: Date;
  monthlyBalance: MonthlyBalance | null;
}

export default function MonthlyUpdatesPanel({
  selectedMonth,
  monthlyBalance,
}: MonthlyUpdatesPanelProps) {
  const monthLabel = selectedMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const formatCurrency = (num: number) => {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const openBal = formatCurrency(monthlyBalance?.opening_balance || 0);
  const inc = formatCurrency(monthlyBalance?.total_income || 0);
  const exp = formatCurrency(monthlyBalance?.total_expenses || 0);
  const closeBal = formatCurrency(monthlyBalance?.closing_balance || 0);

  return (
    <CardTreasury>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Monthly Report Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm text-prose text-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail className="h-4 w-4 " />
            Email Preview
          </div>
          <div className=" space-y-4 mt-6 mb-4 text-slate-700 dark:text-slate-200">
            <p>Dear Co-op Members,</p>
            <div>
              <p>Here is the treasury report for {monthLabel}:</p>
              <ul className="list-disc list-inside my-2 space-y-2">
                <li>Opening Balance: £{openBal}</li>
                <li>Total Income: £{inc}</li>
                <li>Total Payments: £{exp}</li>
                <li>Closing Balance: £{closeBal}</li>
              </ul>
            </div>
            <p>
              All transactions have been reconciled with the bank statement.
            </p>
          </div>
        </div>
        <Button size="sm" className="w-full sm:w-auto">
          <Mail className="h-4 w-4 mr-2" />
          Send Report Email
        </Button>
      </CardContent>
    </CardTreasury>
  );
}
