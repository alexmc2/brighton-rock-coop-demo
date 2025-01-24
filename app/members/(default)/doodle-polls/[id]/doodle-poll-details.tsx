'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { togglePollResponse } from '@/app/members/actions/doodle-polls/id/doodle-poll-details-actions';
import { Avatar } from '@/components/members/ui/avatar';
import { Button } from '@/components/members/ui/button';
import { Card } from '@/components/members/ui/card';
import { Badge } from '@/components/members/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/members/ui/table';
import { CheckCircle2, CircleSlash } from 'lucide-react';
import { cn, getUserColor } from '@/lib/members/utils';
import { format } from 'date-fns';
import type {
  DoodlePollResponse,
  DoodlePollWithDetails,
} from '@/types/members/doodle';
import { eventTypeToCalendarCategory } from '@/types/members/doodle';
import CreateEventButton from '../create-event-button';

interface DoodlePollDetailsProps {
  poll: DoodlePollWithDetails;
  currentUserId?: string;
  currentUserName?: string;
}

export default function DoodlePollDetails({
  poll,
  currentUserId,
  currentUserName,
}: DoodlePollDetailsProps) {
  const router = useRouter();

  // Format poll options for display
  const timeSlots = poll.options.map((option) => ({
    ...option,
    day: format(new Date(option.date), 'EEE').toUpperCase(),
    dayOfMonth: parseInt(format(new Date(option.date), 'd'), 10),
    month: format(new Date(option.date), 'MMM'),
    times: option.start_time
      ? ([
          format(new Date(`2000-01-01T${option.start_time}`), 'HH:mm'),
          option.duration
            ? `${parseFloat(option.duration)} ${
                parseFloat(option.duration) === 1 ? 'hour' : 'hours'
              }`
            : null,
        ].filter(Boolean) as string[])
      : [],
  }));

  // Current user's existing participant (if any)
  const currentUserParticipant = poll.participants.find(
    (p) => p.user_id === currentUserId
  );

  // Local responses
  const [userResponses, setUserResponses] = useState<
    Record<string, DoodlePollResponse>
  >(currentUserParticipant?.responses || {});

  const toggleResponse = async (optionId: string) => {
    if (poll.closed || !currentUserId) return;
    try {
      const { responses } = await togglePollResponse({
        pollId: poll.id,
        optionId,
        userId: currentUserId,
        participantId: currentUserParticipant?.id,
        currentResponses: userResponses,
      });
      setUserResponses(responses);
      router.refresh();
    } catch (error) {
      console.error('Error updating response:', error);
    }
  };

  // Count how many participants gave yes/no/maybe
  const participantsCount = new Set(
    poll.participants
      .filter((p) =>
        Object.values(p.responses).some(
          (r) => r === 'yes' || r === 'maybe' || r === 'no'
        )
      )
      .map((p) => p.user_id)
  ).size;

  const getAvailableCount = (optionId: string) =>
    poll.participants.filter((p) => p.responses[optionId] === 'yes').length;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-none">
        {/* Header Section */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col gap-3">
            {poll.closed ? (
              <Badge
                variant="outline"
                className="w-fit bg-red-50 text-red-700 border-red-200/30 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/30"
              >
                Closed
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="w-fit bg-green-50 text-green-700 border-green-200/30 dark:bg-green-950 dark:text-green-300 dark:border-green-800/30"
              >
                Open
              </Badge>
            )}
            <h2 className="sm:text-2xl text-2xl sm:py-2 py-4 font-semibold text-slate-700 dark:text-white">
              {poll.title}
            </h2>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium">
                Poll created by{' '}
                {poll.created_by_user.full_name || poll.created_by_user.email}{' '}
                on {format(new Date(poll.created_at), 'do MMMM, yyyy')}
              </span>
            </p>
            <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium">Category:</span>
              <span>{eventTypeToCalendarCategory(poll.event_type)}</span>
            </p>
            {poll.response_deadline && (
              <p className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-medium">Response Deadline:</span>
                <span>{format(new Date(poll.response_deadline), 'PPP p')}</span>
              </p>
            )}
            {poll.description && (
              <p className="text-slate-600 dark:text-slate-300">
                {poll.description}
              </p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-slate-600 dark:text-slate-300">Yes</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-600 dark:text-yellow-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-slate-600 dark:text-slate-300">
              If need be
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CircleSlash className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-slate-600 dark:text-slate-300">No</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleSlash className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-600 dark:text-slate-300">Pending</span>
          </div>
        </div>

        {/* Table Wrapper with horizontal scroll */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/80 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                {/* Leftmost (empty) header cell */}
                <TableHead className="w-48 min-w-[180px] " />
                {/* Time Slot Headers */}
                {timeSlots.map((slot, i) => (
                  <TableHead
                    key={slot.id}
                    className={cn(
                      'text-center min-w-[120px] p-5',
                      'border-l border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {slot.month}
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                      {slot.dayOfMonth}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {slot.day}
                    </div>
                    {slot.times.map((time) => (
                      <div
                        key={time}
                        className="text-xs text-slate-600 dark:text-slate-300 mt-2"
                      >
                        {time}
                      </div>
                    ))}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="bg-slate-50 dark:bg-slate-800">
              {/* Participants count row */}
              <TableRow>
                <TableCell className="w-48 text-sm text-slate-600 dark:text-slate-300 ">
                  {participantsCount === 0
                    ? 'No responses yet'
                    : `${participantsCount} ${
                        participantsCount === 1 ? 'response' : 'responses'
                      }`}
                </TableCell>
                {timeSlots.map((slot, i) => (
                  <TableCell
                    key={slot.id}
                    className={cn(
                      'text-center',
                      'border-l border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400 gap-1 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      {getAvailableCount(slot.id)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Current user "Click to respond" row, if poll open */}
              {!poll.closed && currentUserId && (
                <TableRow>
                  <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                    Click to respond {'->'}
                  </TableCell>
                  {timeSlots.map((slot, i) => (
                    <TableCell
                      key={slot.id}
                      className={cn(
                        'p-0 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer',
                        'border-l border-slate-200 dark:border-slate-700'
                      )}
                      onClick={() => toggleResponse(slot.id)}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        {userResponses[slot.id] === 'yes' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        {userResponses[slot.id] === 'maybe' && (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-yellow-600 dark:text-yellow-400"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                        )}
                        {userResponses[slot.id] === 'no' && (
                          <CircleSlash className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        {!userResponses[slot.id] && (
                          <CircleSlash className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              )}

              {/* Each participant's row */}
              {Array.from(
                // Combine multiple participant entries by user_id, keep the newest
                poll.participants.reduce((map, participant) => {
                  const responded = Object.values(participant.responses).some(
                    (r) => r === 'yes' || r === 'maybe' || r === 'no'
                  );
                  if (responded) {
                    const existing = map.get(participant.user_id);
                    if (
                      !existing ||
                      new Date(participant.updated_at) >
                        new Date(existing.updated_at)
                    ) {
                      map.set(participant.user_id, participant);
                    }
                  }
                  return map;
                }, new Map<string, (typeof poll.participants)[0]>())
              ).map(([_, participant]) => (
                <TableRow key={participant.id}>
                  {/* Participant name */}
                  <TableCell className="flex items-center gap-2">
                    <Avatar
                      className={cn(
                        'w-6 h-6 flex items-center justify-center',
                        getUserColor(participant.user_id)
                      )}
                    >
                      <div className="text-white text-xs">
                        {participant.user.full_name?.[0]?.toUpperCase() ||
                          participant.user.email[0].toUpperCase()}
                      </div>
                    </Avatar>
                    <span className="text-slate-900 dark:text-white text-sm">
                      {participant.user.full_name || participant.user.email}
                    </span>
                  </TableCell>

                  {/* Responses for each time slot */}
                  {timeSlots.map((slot, i) => {
                    const response = participant.responses[slot.id];
                    return (
                      <TableCell
                        key={slot.id}
                        className={cn(
                          'p-4 text-center min-w-[100px]',
                          'border-l border-slate-200 dark:border-slate-700',
                          response === 'yes' &&
                            'bg-green-200/70 dark:bg-green-600/30',
                          response === 'maybe' &&
                            'bg-yellow-200/70 dark:bg-yellow-600/30',
                          response === 'no' &&
                            'bg-red-200/70 dark:bg-red-900/30'
                        )}
                      >
                        <div className="flex items-center justify-center">
                          {response === 'yes' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          )}
                          {response === 'maybe' && (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-yellow-600 dark:text-yellow-400"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          )}
                          {response === 'no' && (
                            <CircleSlash className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Create Event Button */}
        {!poll.closed && (
          <div className="mt-6">
            <CreateEventButton
              poll={poll}
              options={poll.options}
              participants={poll.participants}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
