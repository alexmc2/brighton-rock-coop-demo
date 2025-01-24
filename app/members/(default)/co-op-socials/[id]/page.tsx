// app/(default)/co-op-socials/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SocialEventWithDetails } from '@/types/members/social';
import SocialEventHeader from './social-event-header';
import SocialEventDetails from './social-event-details';
import CommentSection from '@/components/members/comments-section';
import { getSocialEventById } from '@/app/members/actions/social-events/id/social-page-actions';

export const metadata: Metadata = {
  title: 'Social Event Details',
  description: 'View and manage social event details',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SocialEventPageProps {
  params: { id: string };
}

export default async function SocialEventPage({
  params,
}: SocialEventPageProps) {
  const event = await getSocialEventById(params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <SocialEventHeader event={event} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2 space-y-6">
          <SocialEventDetails event={event} />
          <CommentSection
            comments={event.comments}
            resourceId={event.id}
            resourceType={{
              type: 'social_event',
              field: 'event_id',
              contentField: 'content',
              userField: 'user_id',
            }}
          />
        </div>
      </div>
    </div>
  );
}
