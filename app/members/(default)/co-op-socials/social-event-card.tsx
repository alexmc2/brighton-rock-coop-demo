// app/(default)/co-op-socials/social-event-card.tsx

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  PartyPopper,
  Film,
  Music,
  UtensilsCrossed,
  Dice5,
  Tv,
  BookOpen,
  Gift,
  Bike,
  Smile,
  Sun,
  PenTool,
  MessageSquare,
} from 'lucide-react';
import { Card } from '@/components/members/ui/card';
import { Badge } from '@/components/members/ui/badge';
import {
  SocialEventWithDetails,
  SocialEventCategory,
  SocialEventStatus,
} from '@/types/members/social';
import { SocialEventBadge } from '@/components/members/social-event-badge';

interface SocialEventCardProps {
  event: SocialEventWithDetails;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const SocialEventCard: React.FC<SocialEventCardProps> = ({ event }) => {
  const getParticipantCount = () => {
    if (!event.participants) return 0;
    // Only count participants who are "going"
    return event.participants.filter((p) => p.status === 'going').length;
  };

  return (
    <Card className="border border-gray-300/50 dark:border-gray-700 flex flex-col h-full bg-white dark:bg-slate-800 shadow-xs rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <SocialEventBadge type="category" value={event.category} />
        </div>

        <Link href={`/members/co-op-socials/${event.id}`}>
          <h3 className="text-lg lg:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 hover:text-green-600 dark:hover:text-green-400">
            {event.title}
          </h3>
        </Link>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          {event.event_date && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(event.event_date), 'EEEE, MMMM do yyyy')}
            </div>
          )}
          {event.start_time && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(event.start_time)}
            </div>
          )}
          {event.location && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 mr-2" />
              {event.location}
            </div>
          )}
          {event.open_to_everyone && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4 mr-2" />
              {getParticipantCount()} / 12 participants
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <SocialEventBadge type="status" value={event.status} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <MessageSquare className="w-4 h-4 mr-1" />
              {event.comments?.length || 0}
            </div>
            <Link
              href={`/members/co-op-socials/${event.id}`}
              className="text-sm font-medium text-coop-600 hover:text-coop-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              View Details →
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SocialEventCard;
