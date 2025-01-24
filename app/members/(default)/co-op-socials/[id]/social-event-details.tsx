'use client';

import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getUserAndParticipation,
  updateParticipation,
} from '@/app/members/actions/social-events/id/social-event-details-actions';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { Card } from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import {
  SocialEventWithDetails,
  SocialEventParticipant,
  ParticipationStatus,
} from '@/types/members/social';
import { getUserColor } from '@/lib/members/utils';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/members/ui/radio-group';
import { cn } from '@/lib/utils';
import { SocialEventBadge } from '@/components/members/social-event-badge';

// ------------------------------
// Friendly formatter for "HH:MM:SS" or "1.5 hours"
// ------------------------------
function formatEventDuration(interval: string | null): string {
  if (!interval) return '';

  let decimalHours = 0;

  // If "HH:MM:SS", parse
  if (interval.includes(':')) {
    const [hhStr, mmStr, ssStr] = interval.split(':');
    const hh = parseInt(hhStr, 10) || 0;
    const mm = parseInt(mmStr, 10) || 0;
    decimalHours = hh + mm / 60;
  } else {
    // "1.5 hours"
    const [floatStr] = interval.split(' ');
    decimalHours = parseFloat(floatStr);
  }

  // Convert decimalHours => e.g. 1.5 => "1 hour 30 minutes"
  const wholeHours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - wholeHours) * 60);

  const parts: string[] = [];
  if (wholeHours > 0) {
    parts.push(wholeHours === 1 ? '1 hour' : `${wholeHours} hours`);
  }
  if (minutes > 0) {
    parts.push(minutes === 1 ? '1 minute' : `${minutes} minutes`);
  }
  if (parts.length === 0) {
    return '0 minutes';
  }
  return parts.join(' ');
}

interface SocialEventDetailsProps {
  event: SocialEventWithDetails;
}

export default function SocialEventDetails({
  event: initialEvent,
}: SocialEventDetailsProps) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    full_name: string | null;
  } | null>(null);
  const [currentUserStatus, setCurrentUserStatus] =
    useState<ParticipationStatus | null>(null);

  // Fetch current user and their participation status once
  useEffect(() => {
    async function fetchUserAndStatus() {
      try {
        const { user, participationStatus } = await getUserAndParticipation(
          event.id
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
  }, [event.id]);

  // If the parent re-renders with a new event, update local
  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  // Handle participation with optimistic UI
  const handleParticipationUpdate = async (
    newStatus: ParticipationStatus | null
  ) => {
    if (!currentUser || isUpdating) return;

    setIsUpdating(true);
    const previousStatus = currentUserStatus;
    setCurrentUserStatus(newStatus);

    const updatedParticipants = [...(event.participants || [])];
    const userIndex = updatedParticipants.findIndex(
      (p) => p.user_id === currentUser.id
    );

    if (newStatus === null) {
      // Remove
      if (userIndex > -1) {
        updatedParticipants.splice(userIndex, 1);
      }
    } else {
      // Add or update
      const updatedParticipant: SocialEventParticipant = {
        event_id: event.id,
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

    setEvent((prev) => ({
      ...prev,
      participants: updatedParticipants,
    }));

    try {
      await updateParticipation({
        eventId: event.id,
        userId: currentUser.id,
        newStatus,
      });
      router.refresh();
    } catch (error) {
      console.error('Error updating participation:', error);
      // revert
      setCurrentUserStatus(previousStatus);
      setEvent((prev) => ({
        ...prev,
        participants: event.participants,
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  // Group participants by status
  const participantsByStatus = event.participants?.reduce(
    (acc, participant) => {
      const status = participant.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(participant);
      return acc;
    },
    {
      going: [] as SocialEventParticipant[],
      maybe: [] as SocialEventParticipant[],
      not_going: [] as SocialEventParticipant[],
    }
  ) || { going: [], maybe: [], not_going: [] };

  // Count "going" only
  const activeParticipantCount =
    event.participants?.filter((p) => p.status === 'going').length || 0;

  // Format "HH:mm:ss" to e.g. "1:30 PM"
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours, 10);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-6">
        {/* Title and Category/Status */}
        <div className="mb-6 space-y-3">
          <div className="flex justify-between items-center mb-2">
            {/* Category badge */}
            <div className="flex flex-wrap gap-2">
              <SocialEventBadge type="category" value={event.category} />
            </div>
            {/* Status badge */}
            <span
              className={cn(
                'px-2.5 py-0.5 text-xs font-medium rounded-full',
                event.status === 'upcoming' &&
                  'bg-green-50 text-green-700 border-green-200/30 dark:bg-green-950 dark:text-green-300 dark:border-green-800/30',
                event.status === 'completed' &&
                  'bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/30',
                event.status === 'cancelled' &&
                  'bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950 dark:text-red-300 dark:border-red-800/30'
              )}
            >
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>

          <h2 className="text-2xl pt-4 font-semibold text-slate-700 dark:text-slate-200">
            {event.title}
          </h2>

          <div className="text-sm text-slate-500 dark:text-slate-500">
            Event created by{' '}
            {event.created_by_user.full_name || event.created_by_user.email} on{' '}
            {format(new Date(event.created_at), 'do MMMM, yyyy')}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2 pt-4">
            Description
          </h3>
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
              {event.description}
            </p>
          )}
        </div>

        {/* Event Date/Time/Duration */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {event.event_date && (
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Event Date
              </h3>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(event.event_date), 'EEEE, MMMM do yyyy')}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {event.start_time && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Start Time
                </h3>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(event.start_time)}
                </div>
              </div>
            )}

            {event.duration && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Duration
                </h3>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatEventDuration(event.duration)}
                </div>
              </div>
            )}

            {event.location && (
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Location
                </h3>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
              </div>
            )}
          </div>
        </div>

        {event.open_to_everyone && (
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Going
            </h3>
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4 mr-2" />
              {activeParticipantCount}{' '}
              {activeParticipantCount === 1 ? 'person going' : 'people going'}
            </div>
          </div>
        )}

        {/* Created / Updated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Event Created
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {format(new Date(event.created_at), 'PPp')}
            </p>
          </div>
          <div>
            <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Last Updated
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {format(new Date(event.updated_at), 'PPp')}
            </p>
          </div>
        </div>

        {/* Participants Section */}
        {event.open_to_everyone && (
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
                    {/* Going */}
                    <div className="flex items-center gap-1">
                      <RadioGroupItem
                        value="going"
                        className="border-green-500 border-3 text-green-500 focus-visible:ring-green-500"
                      />
                      <span className="text-sm text-slate-700 pt-1 dark:text-slate-200 pl-1">
                        Going
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

                    {/* Not Going */}
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

                  {/* Clear */}
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

              {/* Participant Lists */}
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
