// app/(default)/garden/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/members/ui/tabs';
import GardenHeader from './garden-header';
import GardenTaskList from './garden-task-list';
import GardenProjectList from './garden-project-list';
import {
  getGardenTasks,
  getGardenProjects,
} from '@/app/members/actions/garden/garden-page-actions';
import { GardenProjectWithDetails } from '@/types/members/garden';

export const metadata: Metadata = {
  title: 'Garden - Co-op Management',
  description: 'Manage garden areas',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function GardenPage({ searchParams }: PageProps) {
  const tab = (searchParams.tab as string) || 'jobs';
  const [tasks, projects] = await Promise.all([
    getGardenTasks(),
    getGardenProjects(),
  ]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <GardenHeader />

      <Tabs value={tab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs" asChild>
            <Link href="/members/garden?tab=jobs">Garden Jobs</Link>
          </TabsTrigger>
          <TabsTrigger value="projects" asChild>
            <Link href="/members/garden?tab=projects">Projects & Planning</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          <GardenTaskList tasks={tasks} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <GardenProjectList
            projects={projects as GardenProjectWithDetails[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
