// app/(default)/co-op-socials/[id]/social-event-header.tsx

import Link from 'next/link';
import { SocialEventWithDetails } from '@/types/members/social';
import SocialEventActions from './social-event-actions';

interface SocialEventHeaderProps {
  event: SocialEventWithDetails;
}

export default function SocialEventHeader({ event }: SocialEventHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <Link
          href="/members/co-op-socials"
          className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {'<-'} Back to Co-op Socials
        </Link>
      </div>

      <SocialEventActions event={event} />
    </div>
  );
}
