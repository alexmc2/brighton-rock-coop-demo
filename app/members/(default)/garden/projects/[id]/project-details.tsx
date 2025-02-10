'use client';

import { useState, useEffect } from 'react';
import {
  GardenProjectWithDetails,
  GardenProjectParticipationStatus,
  GardenProjectParticipant,
  ProjectReport,
} from '@/types/members/garden';
import { Badge } from '@/components/members/ui/badge';
import { Card } from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/members/ui/radio-group';
import Image from 'next/image';
import { format } from 'date-fns';
import ProjectActions from './project-actions';
import ProjectReports from './project-reports';
import {
  getUserAndProjectParticipation,
  updateProjectParticipation,
  getProjectParticipants,
} from '@/app/members/actions/garden/id/project-details-actions';
import { getProjectReports } from '@/app/members/actions/garden/id/project-reports-actions';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getUserColor } from '@/lib/members/utils';
import Tiptap from '@/components/members/tiptap';

interface ProjectDetailsProps {
  project: GardenProjectWithDetails;
  initialReports: ProjectReport[];
}

export default function ProjectDetails({
  project: initialProject,
  initialReports,
}: ProjectDetailsProps) {
  const supabase = createClientComponentClient();
  const [project, setProject] = useState(initialProject);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name: string | null;
  } | null>(null);
  const [currentUserStatus, setCurrentUserStatus] =
    useState<GardenProjectParticipationStatus | null>(null);
  const [reports, setReports] = useState<ProjectReport[]>(initialReports);

  // Update local state when initialProject changes
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  // Fetch current user and their participation status
  useEffect(() => {
    async function fetchUserAndStatus() {
      try {
        const { user, participationStatus } =
          await getUserAndProjectParticipation(project.id);
        if (user) {
          setCurrentUser(user);
          setCurrentUserStatus(participationStatus);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    fetchUserAndStatus();
  }, [project.id]);

  // Set up real-time subscription for participants
  useEffect(() => {
    // Fetch updated participants when they change
    async function fetchUpdatedParticipants() {
      try {
        const data = await getProjectParticipants(project.id);
        if (data) {
          setProject((prev) => ({
            ...prev,
            participants: data as GardenProjectParticipant[],
          }));
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    }

    const channel = supabase
      .channel(`project_participants_${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demo_garden_project_participants',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          // When participants change, fetch the updated list
          fetchUpdatedParticipants();
        }
      )
      .subscribe();

    // Initial fetch
    fetchUpdatedParticipants();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, supabase]);

  // Set up real-time subscription for reports
  useEffect(() => {
    const channel = supabase
      .channel(`project_reports_${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demo_garden_project_reports',
          filter: `project_id=eq.${project.id}`,
        },
        async () => {
          // When reports change, fetch the updated list
          const reportData = await getProjectReports(project.id);
          setReports(reportData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, supabase]);

  const handleParticipationUpdate = async (
    newStatus: GardenProjectParticipationStatus | null
  ) => {
    if (!currentUser || isUpdating) return;

    setIsUpdating(true);
    const previousStatus = currentUserStatus;
    setCurrentUserStatus(newStatus);

    // Optimistic update
    const updatedParticipants = [...(project.participants || [])];
    const userIndex = updatedParticipants.findIndex(
      (p) => p.user_id === currentUser.id
    );

    if (newStatus === null) {
      // Remove participant
      if (userIndex > -1) {
        updatedParticipants.splice(userIndex, 1);
      }
    } else {
      // Add or update participant
      const updatedParticipant: GardenProjectParticipant = {
        project_id: project.id,
        user_id: currentUser.id,
        status: newStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: currentUser,
      } as GardenProjectParticipant;

      if (userIndex > -1) {
        updatedParticipants[userIndex] = updatedParticipant;
      } else {
        updatedParticipants.push(updatedParticipant);
      }
    }

    // Apply optimistic update
    setProject((prev) => ({
      ...prev,
      participants: updatedParticipants,
    }));

    try {
      const { success, participants } = await updateProjectParticipation({
        projectId: project.id,
        userId: currentUser.id,
        newStatus,
      });

      if (!success) {
        throw new Error('Failed to update participation');
      }
    } catch (error) {
      console.error('Error updating participation:', error);
      // Revert on error
      setCurrentUserStatus(previousStatus);
      setProject((prev) => ({
        ...prev,
        participants: project.participants,
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadgeStyle = (status: string) => {
    const styles: Record<string, string> = {
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
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div className="mb-4">
        <ProjectActions project={project} />
      </div>
      <Card className="p-4 sm:p-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 md:order-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <div
                  className={`text-xs inline-flex font-medium ${statusBadgeStyle(
                    project.status
                  )} rounded-full text-center px-2.5 py-1`}
                >
                  {project.status.charAt(0).toUpperCase() +
                    project.status.slice(1).replace('_', ' ')}
                </div>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-6">
                  {project.title}
                </h1>
              </div>

              <div className="text-sm text-slate-800 dark:text-slate-100">
                Created by{' '}
                {project.created_by_user?.full_name ||
                  project.created_by_user?.email ||
                  'Unknown'}{' '}
                on {format(new Date(project.created_at), 'MMM d, yyyy')} at{' '}
                {format(new Date(project.created_at), 'h:mm a')}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
                  Description
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                  {project.description}
                </div>
              </div>

              {project.area && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
                    Garden Area
                  </h3>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {project.area.name}
                    {project.area.description && (
                      <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                        {project.area.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
                  Last Updated
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {format(new Date(project.updated_at), 'MMM d, yyyy, h:mm a')}
                  {project.last_modified_by_user && (
                    <span>
                      {' '}
                      by{' '}
                      {project.last_modified_by_user.full_name ||
                        project.last_modified_by_user.email ||
                        'Unknown'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 mb-4 md:mb-0 md:order-2">
              <div className="relative aspect-square w-full">
                <Image
                  src={
                    project.main_image_secure_url ||
                    '/members/images/new-project.webp'
                  }
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-cover rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Reports Section */}
      <ProjectReports projectId={project.id} initialReports={reports} />

      {/* Participation Section */}
      <Card className="p-4 sm:p-6 mt-6">
        <div className="bg-slate-50 dark:bg-slate-900 /90 rounded-lg p-4">
          {/* Radios: helping / maybe / unavailable */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <RadioGroup
                value={currentUserStatus || ''}
                onValueChange={(value) => {
                  const newStatus =
                    value === ''
                      ? null
                      : (value as GardenProjectParticipationStatus);
                  handleParticipationUpdate(newStatus);
                }}
                className="flex flex-row items-center gap-3"
              >
                {/* Helping */}
                <div className="flex items-center gap-1">
                  <RadioGroupItem
                    value="helping"
                    className="border-green-500 border-3 text-green-500 focus-visible:ring-green-500"
                  />
                  <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                    Helping
                  </span>
                </div>

                {/* Maybe */}
                <div className="flex items-center gap-1">
                  <RadioGroupItem
                    value="maybe"
                    className="border-yellow-500 border-3 text-yellow-500 focus-visible:ring-yellow-500"
                  />
                  <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                    Maybe
                  </span>
                </div>

                {/* Unavailable */}
                <div className="flex items-center gap-1">
                  <RadioGroupItem
                    value="unavailable"
                    className="border-red-500 border-3 text-red-500 focus-visible:ring-red-500"
                  />
                  <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                    Unavailable
                  </span>
                </div>
              </RadioGroup>

              {/* Clear Button */}
              {currentUserStatus && (
                <Button
                  variant="ghost"
                  onClick={() => handleParticipationUpdate(null)}
                  disabled={isUpdating}
                  size="sm"
                  className="text-xs sm:text-sm pt-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Participants Lists */}
          <div className="space-y-6">
            {(['helping', 'maybe', 'unavailable'] as const).map((status) => {
              const participants = project.participants?.filter(
                (p) => p.status === status
              );
              if (!participants?.length) return null;

              const statusLabels: Record<
                GardenProjectParticipationStatus,
                string
              > = {
                helping: 'Participants',
                maybe: 'Maybe',
                unavailable: 'Not Available',
              };

              return (
                <div key={status}>
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
                    {statusLabels[status]} ({participants.length})
                  </h4>
                  <div className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {participants.map((participant) => (
                      <div
                        key={participant.user_id}
                        className="flex items-center px-4 py-3"
                      >
                        <div
                          className={`h-8 w-8 rounded-full ${getUserColor(
                            participant.user_id
                          )} flex items-center justify-center`}
                        >
                          <span className="text-sm font-medium text-white">
                            {participant.user?.full_name?.[0]?.toUpperCase() ||
                              participant.user?.email[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {participant.user?.full_name ||
                            participant.user?.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
}
