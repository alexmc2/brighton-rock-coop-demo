// app/(default)/doodle-polls/[id]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getDoodlePollById,
  getCurrentUserWithProfile,
} from '@/app/members/actions/doodle-polls/id/doodle-poll-page-actions';
import DoodlePollDetails from './doodle-poll-details';
import DoodlePollHeader from './doodle-poll-header';

export const metadata: Metadata = {
  title: 'Doodle Poll Details',
  description: 'View and respond to doodle poll',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DoodlePollPageProps {
  params: { id: string };
}

export default async function DoodlePollPage({ params }: DoodlePollPageProps) {
  const [poll, { user, profile }] = await Promise.all([
    getDoodlePollById(params.id),
    getCurrentUserWithProfile(),
  ]);

  if (!poll) {
    notFound();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <DoodlePollHeader poll={poll} />
      <DoodlePollDetails
        poll={poll}
        currentUserId={user?.id}
        currentUserName={profile?.full_name}
      />
    </div>
  );
}
