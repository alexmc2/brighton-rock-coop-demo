'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  GardenTaskWithDetails,
  GardenTaskParticipationStatus,
  GardenTaskParticipant,
} from '@/types/members/garden';
import {
  getUserAndTaskParticipation,
  updateTaskParticipation,
} from '@/app/members/actions/garden/id/task-details-actions';
import { Card } from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import { getUserColor } from '@/lib/members/utils';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/members/ui/radio-group';
import TaskActions from './task-actions';

// Converts Postgres interval "HH:MM:SS" into a string like "1 hour 30 minutes".
function formatIntervalAsHM(intervalString: string): string {
  if (!intervalString) return '';
  const [hhStr, mmStr, ssStr] = intervalString.split(':');
  const hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;
  // We ignore seconds (ssStr) for typical usage

  const parts = [];
  if (hh > 0) {
    parts.push(hh === 1 ? '1 hour' : `${hh} hours`);
  }
  if (mm > 0) {
    parts.push(mm === 1 ? '1 minute' : `${mm} minutes`);
  }
  // If zero hours & minutes, you might want to handle that case, e.g. "0 minutes"
  if (hh === 0 && mm === 0) {
    return '0 minutes';
  }
  return parts.join(' ');
}

interface TaskDetailsProps {
  task: GardenTaskWithDetails;
}

export default function TaskDetails({ task: initialTask }: TaskDetailsProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isUpdating, setIsUpdating] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name: string | null;
  } | null>(null);

  const [currentUserStatus, setCurrentUserStatus] =
    useState<GardenTaskParticipationStatus | null>(null);

  // Update local state when initialTask changes
  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Fetch current user and their participation status
  useEffect(() => {
    async function fetchUserAndStatus() {
      try {
        const { user, participationStatus } = await getUserAndTaskParticipation(
          task.id
        );
        if (user) {
          setCurrentUser(user);
          setCurrentUserStatus(participationStatus);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    fetchUserAndStatus();
  }, [task.id]);

  // Set up real-time subscription for participants
  useEffect(() => {
    async function fetchParticipants() {
      const { data: updatedParticipants, error } = await supabase
        .from('demo_garden_task_participants')
        .select(
          `
          id,
          task_id,
          user_id,
          status,
          created_at,
          updated_at,
          user:demo_profiles(id, email, full_name)
        `
        )
        .eq('task_id', task.id)
        .returns<GardenTaskParticipant[]>();

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      if (updatedParticipants) {
        setTask((prev) => ({
          ...prev,
          participants: updatedParticipants,
        }));
      }
    }

    fetchParticipants();

    const channel = supabase
      .channel('task_participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demo_garden_task_participants',
          filter: `task_id=eq.${task.id}`,
        },
        fetchParticipants
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [task.id, supabase]);

  // ------------------------------
  // Participation Status Handler
  // ------------------------------
  const handleParticipationUpdate = async (
    newStatus: GardenTaskParticipationStatus | null
  ) => {
    if (!currentUser || isUpdating) return;

    setIsUpdating(true);
    const previousStatus = currentUserStatus;
    setCurrentUserStatus(newStatus);

    const updatedParticipants = [...(task.participants || [])];
    const userIndex = updatedParticipants.findIndex(
      (p) => p.user_id === currentUser.id
    );

    if (newStatus === null) {
      // Remove the user from participants
      if (userIndex > -1) {
        updatedParticipants.splice(userIndex, 1);
      }
    } else {
      const updatedParticipant = {
        id: `${task.id}_${currentUser.id}`,
        task_id: task.id,
        user_id: currentUser.id,
        status: newStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: currentUser,
      };

      if (userIndex > -1) {
        updatedParticipants[userIndex] = updatedParticipant;
      } else {
        updatedParticipants.push(updatedParticipant);
      }
    }

    setTask((prev) => ({
      ...prev,
      participants: updatedParticipants,
    }));

    try {
      await updateTaskParticipation({
        taskId: task.id,
        userId: currentUser.id,
        newStatus,
      });
    } catch (error) {
      console.error('Error updating participation:', error);
      // revert
      setCurrentUserStatus(previousStatus);
      setTask((prev) => ({
        ...prev,
        participants: task.participants,
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  // ------------------------------
  // Badge Helpers
  // ------------------------------
  const getStatusBadgeStyle = (status: string) => {
    const styles = {
      pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300',
      in_progress:
        'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
      upcoming:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      completed:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPriorityBadgeStyle = (priority: string) => {
    const styles = {
      low: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800/30 dark:text-cyan-300',
      medium:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300',
      urgent: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-6">
        {/* Status & Priority */}
        <div className="flex flex-wrap gap-2">
          <div
            className={`text-xs inline-flex font-medium ${getStatusBadgeStyle(
              task.status
            )} rounded-full text-center px-2.5 py-1`}
          >
            {task.status.charAt(0).toUpperCase() +
              task.status.slice(1).replace('_', ' ')}
          </div>
          <div
            className={`text-xs inline-flex font-medium ${getPriorityBadgeStyle(
              task.priority
            )} rounded-full text-center px-2.5 py-1`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold">
            {task.title}
          </h1>
        </div>

        {/* Created By */}
        <div className="text-sm text-slate-800 dark:text-slate-100">
          Created by{' '}
          {task.created_by_user?.full_name ||
            task.created_by_user?.email ||
            'Unknown'}{' '}
          on {format(new Date(task.created_at), 'MMM d, yyyy')} at{' '}
          {format(new Date(task.created_at), 'h:mm a')}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
            Description
          </h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
            {task.description}
          </div>
        </div>

        {/* Date/Time/Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Due Date & Time */}
          {task.due_date && (
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
                Date
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {format(new Date(task.due_date), 'MMM d, yyyy')}
                {task.scheduled_time &&
                  `, at ${format(
                    new Date(`2000-01-01 ${task.scheduled_time}`),
                    'h:mm a'
                  )}`}
              </div>
            </div>
          )}

          {/* Human‐friendly Duration */}
          {task.duration && (
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
                Duration
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {formatIntervalAsHM(task.duration)}
              </div>
            </div>
          )}
        </div>

        {/* Assigned To / Last Updated */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
              Assigned To
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {task.assigned_to || 'Everyone'}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
              Last Updated
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {format(new Date(task.updated_at), 'MMM d, yyyy, h:mm a')}
            </div>
          </div>
        </div>

        {/* Participation Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="bg-slate-50 dark:bg-gray-900 /90 rounded-lg p-4">
            {/* Radios: helping / maybe / unavailable */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <RadioGroup
                  value={currentUserStatus || ''}
                  onValueChange={(value) => {
                    const newStatus =
                      value === ''
                        ? null
                        : (value as GardenTaskParticipationStatus);
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
                const participants = task.participants?.filter(
                  (p) => p.status === status
                );
                if (!participants?.length) return null;

                const statusLabels: Record<
                  GardenTaskParticipationStatus,
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
        </div>

        {/* Edit/Delete Buttons */}
        <TaskActions
          task={task}
          onTaskUpdate={(updatedTask) => setTask(updatedTask)}
        />
      </div>
    </Card>
  );
}
