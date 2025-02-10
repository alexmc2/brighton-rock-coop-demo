// app/members/(default)/treasury/bookkeeping/(tabs)/reports/page.tsx

import { cookies } from 'next/headers';
import { getMonthlyBalance } from '@/app/members/actions/treasury/bookkeeping-actions';
import MonthlyUpdatesPanel from './monthly-reports-panel';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  function getSelectedMonth(): Date {
    const c = cookies().get('treasury-selected-month')?.value;
    if (c) {
      const d = new Date(c);
      if (!isNaN(d.valueOf())) return d;
    }
    return new Date();
  }

  const selectedMonth = getSelectedMonth();
  const balRes = await getMonthlyBalance(selectedMonth);
  const monthlyBalance = balRes.success ? balRes.data ?? null : null;

  return (
    <div className="space-y-6">
      <MonthlyUpdatesPanel
        selectedMonth={selectedMonth}
        monthlyBalance={monthlyBalance}
      />
    </div>
  );
}
