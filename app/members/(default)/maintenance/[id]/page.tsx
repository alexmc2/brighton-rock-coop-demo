import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MaintenanceComment } from '@/types/members/maintenance';
import CommentSection from '@/components/members/comments-section';
import RequestHeader from './request-header';
import RequestDetails from './request-details';
import VisitScheduler from './visit-scheduler';
import {
  getMaintenanceRequest,
  getHouses,
} from '@/app/members/actions/maintenance/id/page-actions';

export const metadata: Metadata = {
  title: 'Maintenance Request - Co-op Management',
  description: 'View and manage maintenance request details',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MaintenanceRequestPageProps {
  params: {
    id: string;
  };
}

export default async function MaintenanceRequestPage({
  params,
}: MaintenanceRequestPageProps) {
  const request = await getMaintenanceRequest(params.id);

  if (!request) {
    notFound();
  }

  const houses = await getHouses();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <RequestHeader request={request} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2">
          <RequestDetails request={request} houses={houses} />
        </div>

        <div className="space-y-6">
          <VisitScheduler request={request} />
          <div className="xl:hidden">
            <CommentSection<MaintenanceComment>
              comments={request.comments}
              resourceId={request.id}
              resourceType={{
                type: 'maintenance',
                field: 'request_id',
                contentField: 'comment',
                userField: 'user_id',
              }}
            />
          </div>
        </div>

        <div className="hidden xl:block xl:col-span-2">
          <CommentSection<MaintenanceComment>
            comments={request.comments}
            resourceId={request.id}
            resourceType={{
              type: 'maintenance',
              field: 'request_id',
              contentField: 'comment',
              userField: 'user_id',
            }}
          />
        </div>
      </div>
    </div>
  );
}
