// app/(default)/development/page.tsx

import DevelopmentHeader from './development-header';
import InitiativeList from './development-list';
import { getInitiatives } from '@/app/members/actions/development/page-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DevelopmentPage() {
  const initiatives = await getInitiatives();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <DevelopmentHeader />
      <InitiativeList initiatives={initiatives} />
    </div>
  );
}
