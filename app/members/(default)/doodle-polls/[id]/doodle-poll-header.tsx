import Link from 'next/link';
import type { DoodlePollWithDetails } from '@/types/members/doodle';
import DoodlePollActions from './doodle-poll-actions';

interface DoodlePollHeaderProps {
  poll: DoodlePollWithDetails;
}

export default function DoodlePollHeader({ poll }: DoodlePollHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <Link
          href="/members/doodle-polls"
          className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {'<-'} Back to Doodle Polls
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 sm:flex-nowrap sm:justify-between sm:items-center">
        <div>
          <DoodlePollActions poll={poll} />
        </div>
      </div>
    </div>
  );
}
