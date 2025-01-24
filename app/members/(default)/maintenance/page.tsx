// app/(default)/maintenance/page.tsx

import { Metadata } from 'next';
import MaintenanceList from './maintenance-list';
import MaintenanceHeader from './maintenance-header';
import {
  getMaintenanceRequests,
  getHouses,
} from '@/app/members/actions/maintenance/maintenance-page-actions';

export const metadata: Metadata = {
  title: 'Maintenance - Co-op Management',
  description: 'Manage maintenance requests and visits',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MaintenancePage() {
  const [requests, houses] = await Promise.all([
    getMaintenanceRequests(),
    getHouses(),
  ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <MaintenanceHeader houses={houses} />
      <MaintenanceList requests={requests} />
    </div>
  );
}
