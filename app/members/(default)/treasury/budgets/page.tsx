// app/members/(default)/treasury/budgets/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BudgetsPage() {
  redirect('/members/treasury/budgets/overview');
}
