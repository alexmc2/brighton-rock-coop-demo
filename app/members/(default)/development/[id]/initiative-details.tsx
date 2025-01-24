'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  DevelopmentInitiativeWithDetails,
  ParticipationStatus,
  EventParticipant,
} from '@/types/members/development';
import { Card } from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { getUserColor } from '@/lib/members/utils';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/members/ui/radio-group';
import {
  getUserAndParticipationStatus,
  getInitiativeParticipants,
  updateParticipationStatus,
} from '@/app/members/actions/development/id/initiative-details-actions';
import { Badge } from '@/components/members/ui/badge';
import { cn } from '@/lib/utils';

interface InitiativeDetailsProps {
  initiative: DevelopmentInitiativeWithDetails;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDuration = (duration: string) => {
  const hours = parseInt(duration.split(' ')[0]);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
};

export default function InitiativeDetails({
  initiative: initialInitiative,
}: InitiativeDetailsProps) {
  const supabase = createClientComponentClient();
  const [initiative, setInitiative] = useState(initialInitiative);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name: string | null;
  } | null>(null);
  const [currentUserStatus, setCurrentUserStatus] =
    useState<ParticipationStatus | null>(null);

  useEffect(() => {
    async function fetchUserAndStatus() {
      const { user, participationStatus, error } =
        await getUserAndParticipationStatus(initiative.id);
      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }
      if (user) {
        setCurrentUser(user);
        setCurrentUserStatus(participationStatus);
      }
    }

    fetchUserAndStatus();
  }, [initiative.id]);

  useEffect(() => {
    if (initiative.initiative_type !== 'event') {
      return; // Only fetch participants if it's an event
    }

    async function fetchParticipants() {
      const { data, error } = await getInitiativeParticipants(initiative.id);
      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }
      if (data) {
        setInitiative((prev) => ({
          ...prev,
          participants: data,
        }));
      }
    }

    fetchParticipants();
    // Set up real-time subscription
    const channel = supabase
      .channel('event_participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${initiative.id}`,
        },
        fetchParticipants
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initiative.id, initiative.initiative_type, supabase]);

  const handleParticipationUpdate = async (
    newStatus: ParticipationStatus | null
  ) => {
    if (!currentUser || isUpdating) return;

    setIsUpdating(true);
    const previousStatus = currentUserStatus;
    setCurrentUserStatus(newStatus);

    const updatedParticipants = [...(initiative.participants || [])];
    const userIndex = updatedParticipants.findIndex(
      (p) => p.user_id === currentUser.id
    );

    if (newStatus === null) {
      if (userIndex > -1) {
        updatedParticipants.splice(userIndex, 1);
      }
    } else {
      const updatedParticipant: EventParticipant = {
        event_id: initiative.id,
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

    setInitiative((prev) => ({
      ...prev,
      participants: updatedParticipants,
    }));

    try {
      const { success, error } = await updateParticipationStatus(
        initiative.id,
        currentUser.id,
        newStatus
      );

      if (!success && error) throw new Error(error);
    } catch (error) {
      console.error('Error updating participation:', error);
      setCurrentUserStatus(previousStatus);
      setInitiative((prev) => ({
        ...prev,
        participants: initiative.participants,
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const participantsByStatus = initiative.participants?.reduce(
    (acc, participant) => {
      const status = participant.status as ParticipationStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push(participant);
      return acc;
    },
    {
      going: [] as EventParticipant[],
      maybe: [] as EventParticipant[],
      not_going: [] as EventParticipant[],
    }
  ) || { going: [], maybe: [], not_going: [] };

  const activeParticipantCount =
    initiative.participants?.filter((p) => p.status !== 'not_going').length ||
    0;

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-6">
        {/* Title and Created By */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col gap-3">
            <Badge
              variant="outline"
              className={cn(
                'w-fit',
                initiative.status === 'active' &&
                  'bg-green-50 text-green-700 border-green-200/30 dark:bg-green-950 dark:text-green-300 dark:border-green-800/30',
                initiative.status === 'completed' &&
                  'bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/30',
                initiative.status === 'on_hold' &&
                  'bg-yellow-200 text-yellow-800 border-yellow-200/30 dark:bg-yellow-900  dark:text-yellow-300 dark:border-yellow-800/30',
                initiative.status === 'cancelled' &&
                  'bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950 dark:text-red-300 dark:border-red-800/30'
              )}
            >
              {initiative.status.charAt(0).toUpperCase() +
                initiative.status.slice(1).replace('_', ' ')}
            </Badge>
            <h2 className="text-2xl py-2  font-semibold text-slate-900 dark:text-white">
              {initiative.title}
            </h2>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium">
                {initiative.initiative_type === 'event' ? 'Event' : 'Project'}{' '}
                created by {''}
                {initiative.created_by_user.full_name ||
                  initiative.created_by_user.email}
              </span>
            </p>
            {initiative.description && (
              <p className="text-slate-600 dark:text-slate-300">
                {initiative.description}
              </p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {initiative.event_date && (
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Event Date
              </h3>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(initiative.event_date), 'EEEE, MMMM do yyyy')}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {initiative.start_time && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Start Time
                </h3>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(initiative.start_time)}
                </div>
              </div>
            )}

            {initiative.duration && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Duration
                </h3>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatDuration(initiative.duration)}
                </div>
              </div>
            )}

            {initiative.location && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Location
                </h3>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 mr-2" />
                  {initiative.location}
                </div>
              </div>
            )}

            {/* <div>
              <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Created By
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {initiative.created_by_user.full_name ||
                  initiative.created_by_user.email}
              </p>
            </div> */}
          </div>
        </div>

        {initiative.initiative_type === 'event' &&
          initiative.open_to_everyone && (
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Participants
              </h3>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4 mr-2" />
                {activeParticipantCount}{' '}
                {activeParticipantCount === 1 ? 'participant' : 'participants'}
              </div>
            </div>
          )}

        {/* Created / Last Updated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Event Created
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {format(new Date(initiative.created_at), 'PPp')}
            </p>
          </div>

          <div>
            <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Last Updated
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {format(new Date(initiative.updated_at), 'PPp')}
            </p>
          </div>
        </div>

        {/* Participants Section */}
        {initiative.initiative_type === 'event' &&
          initiative.open_to_everyone && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="bg-slate-50 dark:bg-slate-900/90 rounded-lg p-4">
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <RadioGroup
                      value={currentUserStatus || ''}
                      onValueChange={(value) => {
                        const newStatus =
                          value === '' ? null : (value as ParticipationStatus);
                        handleParticipationUpdate(newStatus);
                      }}
                      className="flex flex-row items-center gap-3"
                    >
                      <div className="flex items-center gap-1">
                        <RadioGroupItem
                          value="going"
                          className="border-green-500 border-3 text-green-500 focus-visible:ring-green-500"
                        />
                        <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                          Going
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <RadioGroupItem
                          value="maybe"
                          className="border-yellow-500 border-3 text-yellow-500 focus-visible:ring-yellow-500"
                        />
                        <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                          Maybe
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <RadioGroupItem
                          value="not_going"
                          className="border-red-500 border-3 text-red-500 focus-visible:ring-red-500"
                        />
                        <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                          Not Going
                        </span>
                      </div>
                    </RadioGroup>

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

                <div className="space-y-6">
                  {(['going', 'maybe', 'not_going'] as const).map((status) => {
                    const participants = participantsByStatus[status];
                    if (!participants?.length) return null;

                    return (
                      <div key={status}>
                        <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 capitalize">
                          {status.replace('_', ' ')} ({participants.length})
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
          )}
      </div>
    </Card>
  );
}
