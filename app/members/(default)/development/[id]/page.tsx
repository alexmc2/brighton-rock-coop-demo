// app/(default)/development/[id]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DevelopmentInitiativeWithDetails,
  DevelopmentComment,
} from '@/types/members/development';
import InitiativeHeader from './initiative-header';
import InitiativeDetails from './initiative-details';
import CommentSection from '@/components/members/comments-section';
import { getInitiativeById } from '@/app/members/actions/development/id/page-actions';

export const metadata: Metadata = {
  title: 'Development Initiative Details',
  description: 'View and manage development initiative details',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface InitiativeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InitiativeDetailPage({
  params,
}: InitiativeDetailPageProps) {
  const initiative = await getInitiativeById(params.id);

  if (!initiative) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <InitiativeHeader initiative={initiative} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Left column - Initiative details and comments */}
        <div className="xl:col-span-2 space-y-6">
          <InitiativeDetails initiative={initiative} />
          <CommentSection<DevelopmentComment>
            comments={initiative.comments}
            resourceId={initiative.id}
            resourceType={{
              type: 'development',
              field: 'initiative_id',
              contentField: 'content',
              userField: 'user_id',
            }}
          />
        </div>
      </div>
    </div>
  );
}
