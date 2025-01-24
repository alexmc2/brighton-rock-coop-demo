// app/(default)/co-op-socials/page.tsx
import { Metadata } from 'next';
import SocialEventsHeader from './social-events-header';
import SocialEventsList from './social-events-list';
import { getSocialEvents } from '@/app/members/actions/social-events/social-page-actions';

export const metadata: Metadata = {
  title: 'Co-op Social Events',
  description: 'View and manage co-op social events',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoOpSocialsPage() {
  const events = await getSocialEvents();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <SocialEventsHeader />
      <SocialEventsList events={events} />
    </div>
  );
}
