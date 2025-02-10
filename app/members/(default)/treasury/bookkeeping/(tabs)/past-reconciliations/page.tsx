// app/members/(default)/treasury/bookkeeping/(tabs)/past-reconciliations/page.tsx
import { listPastReconciliations } from '@/app/members/actions/treasury/bookkeeping-actions';
import PastReconciliationsPanel from './past-reconciliations-panel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PastReconciliationsPage() {
  // Server fetch
  const res = await listPastReconciliations();
  const data = res.success && res.data ? res.data : [];

  return (
    <div className="space-y-6">
      <PastReconciliationsPanel reconciliations={data} />
    </div>
  );
}
