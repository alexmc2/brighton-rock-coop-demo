import { redirect } from 'next/navigation';

export default function ReportIndexPage() {
  // Get current date and format it as YYYY-MM
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const currentMonth = `${year}-${month}`;

  // Redirect to the current month's report
  redirect(`/members/treasury/report/${currentMonth}`);
}
