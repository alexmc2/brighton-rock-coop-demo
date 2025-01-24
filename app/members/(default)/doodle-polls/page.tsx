// app/(default)/doodle-polls/page.tsx
import { Metadata } from 'next';
import {
  getDoodlePolls,
  getCurrentUser,
} from '@/app/members/actions/doodle-polls/doodle-poll-page-actions';
import DoodlePollsList from './doodle-polls-list';
import DoodlePollsHeader from './doodle-polls-header';

export const metadata: Metadata = {
  title: 'Doodle polls - Brighton Rock',
  description: 'Schedule events and tasks with Doodle polls',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DoodlePollsPage() {
  const [polls, user] = await Promise.all([getDoodlePolls(), getCurrentUser()]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <DoodlePollsHeader />
      <DoodlePollsList polls={polls} currentUserId={user?.id} />
    </div>
  );
}
