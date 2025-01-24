// app/(default)/garden/[id]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTaskDetails } from '@/app/members/actions/garden/id/task-details-actions';
import { GardenComment } from '@/types/members/garden';
import CommentSection from '@/components/members/comments-section';
import TaskHeader from './task-header';
import TaskDetails from './task-details';
import GardenImages from '../garden-images';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Garden Task - Co-op Management',
  description: 'View and manage Garden task details',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

export default async function GardenTaskPage({ params }: PageProps) {
  const task = await getTaskDetails(params.id);
  if (!task) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/members/garden?tab=jobs"
          className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {'<-'} Back to Garden Jobs
        </Link>
      </div>

      <TaskHeader task={task} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        <div className="xl:col-span-2 space-y-6">
          <TaskDetails task={task} />

          {/* Images section */}
          <div className="mt-6 mb-6">
            <GardenImages
              resourceId={task.id}
              images={task.images}
              isProject={false}
            />
          </div>

          {/* Comments section */}
          <CommentSection<GardenComment>
            comments={task.comments || []}
            resourceId={task.id}
            resourceType={{
              type: 'garden',
              field: 'task_id',
              contentField: 'comment',
              userField: 'user_id',
            }}
          />
        </div>
      </div>
    </div>
  );
}
