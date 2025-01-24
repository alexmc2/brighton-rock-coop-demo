import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectDetails } from '@/app/members/actions/garden/id/project-details-actions';
import { getProjectReports } from '@/app/members/actions/garden/id/project-reports-actions';
import { GardenComment } from '@/types/members/garden';
import CommentSection from '@/components/members/comments-section';
import ProjectDetails from './project-details';
import GardenImages from '../../garden-images';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Garden Project - Co-op Management',
  description: 'View and manage Garden project details',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProjectPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProjectDetails(params.id);
  if (!project) {
    notFound();
  }

  const reports = await getProjectReports(params.id);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/members/garden?tab=projects"
          className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {'<-'} Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        <div className="xl:col-span-2 space-y-6">
          <ProjectDetails project={project} initialReports={reports} />

          {/* Images section */}
          <div className="mt-6 mb-6">
            <GardenImages
              resourceId={project.id}
              images={project.images}
              isProject={true}
            />
          </div>

          {/* Comments section */}
          <CommentSection<GardenComment>
            comments={project.comments || []}
            resourceId={project.id}
            resourceType={{
              type: 'garden',
              field: 'project_id',
              contentField: 'comment',
              userField: 'user_id',
            }}
          />
        </div>
      </div>
    </div>
  );
}
