'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';
import { GardenProjectWithDetails } from '@/types/members/garden';
import { Badge } from '@/components/members/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/members/ui/card';
import { useQueryState } from 'nuqs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import NewGardenProjectModal from './new-garden-project-modal';
import ProjectActions from '@/app/members/(default)/garden/projects/[id]/project-actions';
import {
  Users2,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Clock,
  User2,
} from 'lucide-react';

interface GardenProjectListProps {
  projects: GardenProjectWithDetails[];
}

type SortField = 'created_at' | 'updated_at';
type SortOrder = 'asc' | 'desc';

export default function GardenProjectList({
  projects,
}: GardenProjectListProps) {
  // URL state management with nuqs
  const [sortField, setSortField] = useQueryState<SortField>(
    'projectSortField',
    {
      defaultValue: 'created_at',
      parse: (value): SortField => value as SortField,
    }
  );
  const [sortOrder, setSortOrder] = useQueryState<SortOrder>(
    'projectSortOrder',
    {
      defaultValue: 'desc',
      parse: (value): SortOrder => value as SortOrder,
    }
  );

  // NEW: Status & Area filters
  const [statusFilter, setStatusFilter] = useQueryState<string>(
    'projectStatusFilter',
    {
      defaultValue: 'all',
      parse: (value): string => value as string,
    }
  );
  const [areaFilter, setAreaFilter] = useQueryState<string>(
    'projectAreaFilter',
    {
      defaultValue: 'all',
      parse: (value): string => value as string,
    }
  );

  // Retrieve unique statuses or define them:
  const allStatuses = [
    'all',
    'active',
    'planning',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled',
  ];

  // Gather unique areas from the projects (or from an external source as needed)
  const allAreas = [
    'all',
    ...Array.from(
      new Set(
        projects.filter((p) => p.area?.name).map((p) => p.area?.name || '')
      )
    ),
  ];

  // Sort projects
  const sortedProjects = [...projects].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (!aValue && !bValue) return 0;
    if (!aValue) return sortOrder === 'asc' ? 1 : -1;
    if (!bValue) return sortOrder === 'asc' ? -1 : 1;

    const comparison = aValue > bValue ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Filter
  const filteredProjects = sortedProjects.filter((project) => {
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;
    const matchesArea =
      areaFilter === 'all' || project.area?.name === areaFilter;
    return matchesStatus && matchesArea;
  });

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Select
            value={sortField}
            onValueChange={(value: SortField) => setSortField(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="updated_at">Last Updated</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(value: SortOrder) => setSortOrder(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {allStatuses.map((st) => (
                <SelectItem key={st} value={st}>
                  {st === 'all'
                    ? 'All'
                    : st.charAt(0).toUpperCase() +
                      st.slice(1).replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={areaFilter}
            onValueChange={(value) => setAreaFilter(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter area" />
            </SelectTrigger>
            <SelectContent>
              {allAreas.map((ar) => (
                <SelectItem key={ar} value={ar}>
                  {ar === 'all' ? 'All Areas' : ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="justify-end">
            <NewGardenProjectModal />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          // Get counts
          const imageCount = project.images?.length || 0;
          const commentCount = project.comments?.length || 0;
          const participantCount =
            project.participants?.filter((p) => p.status === 'helping')
              .length || 0;

          // Color-coded status
          const statusColors: Record<string, string> = {
            active:
              'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
            planning:
              'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
            in_progress:
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300',
            on_hold:
              'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300',
            completed:
              'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
            cancelled:
              'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
          };
          const statusBadgeClass =
            statusColors[project.status] || 'bg-gray-100 text-gray-800';

          return (
            <Link
              key={project.id}
              href={`/members/garden/projects/${project.id}`}
            >
              <Card className="h-full  transition-colors cursor-pointer group">
                {project.main_image_secure_url ? (
                  <div className="relative aspect-[5/4] mb-4 overflow-hidden">
                    <Image
                      src={project.main_image_secure_url}
                      alt={project.title}
                      fill
                      className="object-cover rounded-t-lg transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[5/4] mb-4 overflow-hidden">
                    <Image
                      src="/members/images/new-project.webp"
                      alt="Default project image"
                      fill
                      className="object-cover rounded-t-lg transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader className="pb-2 pt-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-xl text-slate-800 dark:text-slate-100">
                        {project.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <Badge className={`font-normal ${statusBadgeClass}`}>
                      {project.status.charAt(0).toUpperCase() +
                        project.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-2">
                      {project.area && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{project.area.name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(project.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Updated{' '}
                          {format(new Date(project.updated_at), 'MMM d')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <User2 className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {project.created_by_user?.full_name ||
                            project.created_by_user?.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Users2 className="h-3.5 w-3.5" />
                        <span>{participantCount} Participants</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{project.comments?.length || 0} Comments</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>{project.images?.length || 0} Images</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            No projects found
          </div>
        )}
      </div>
    </div>
  );
}
