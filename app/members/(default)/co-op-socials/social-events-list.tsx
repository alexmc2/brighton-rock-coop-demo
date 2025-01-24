'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/members/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import {
  SocialEventWithDetails,
  SocialEventCategory,
  SocialEventStatus,
} from '@/types/members/social';
import SocialEventCard from './social-event-card';
import { useQueryState } from 'nuqs';
import { getSocialEventParticipants } from '@/app/members/actions/social-events/social-events-list-actions';

interface SocialEventsListProps {
  events?: SocialEventWithDetails[];
}

const ITEMS_PER_PAGE = 6;

type SortField = 'created_at' | 'event_date';
type SortOrder = 'asc' | 'desc';

export default function SocialEventsList({
  events: initialEvents = [],
}: SocialEventsListProps) {
  // State management with URL parameters
  const [category, setCategory] = useQueryState('category', {
    defaultValue: 'all',
    parse: (value): 'all' | SocialEventCategory => value as any,
  });
  const [status, setStatus] = useQueryState('status', {
    defaultValue: 'all',
    parse: (value): 'all' | SocialEventStatus => value as any,
  });
  const [sortField, setSortField] = useQueryState<SortField>('sortField', {
    defaultValue: 'event_date',
    parse: (value): SortField => value as SortField,
  });
  const [sortOrder, setSortOrder] = useQueryState<SortOrder>('sortOrder', {
    defaultValue: 'asc',
    parse: (value): SortOrder => value as SortOrder,
  });
  const [currentPage, setCurrentPage] = useQueryState('page', {
    defaultValue: '1',
    parse: (value) => value,
  });

  // Local state for events
  const [events, setEvents] = useState(initialEvents);

  // Memoized filter and sort function
  const getFilteredAndSortedEvents = useCallback(
    (eventsList: SocialEventWithDetails[]) => {
      return eventsList
        .filter((event) => {
          if (category !== 'all' && event.category !== category) return false;
          if (status !== 'all' && event.status !== status) return false;
          return true;
        })
        .sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];

          if (!aValue && !bValue) return 0;
          if (!aValue) return sortOrder === 'asc' ? 1 : -1;
          if (!bValue) return sortOrder === 'asc' ? -1 : 1;

          const comparison = aValue > bValue ? 1 : -1;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
    },
    [category, status, sortField, sortOrder]
  );

  // Update events when initialEvents prop changes
  useEffect(() => {
    if (JSON.stringify(events) !== JSON.stringify(initialEvents)) {
      setEvents(initialEvents);
    }
  }, [initialEvents, events]);

  // Compute pagination
  const filteredAndSortedEvents = getFilteredAndSortedEvents(events);
  const totalPages = Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE);
  const startIndex = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredAndSortedEvents.length
  );
  const paginatedEvents = filteredAndSortedEvents.slice(startIndex, endIndex);

  // Compute unique categories and statuses
  const categories = [
    'all',
    ...Array.from(new Set(events.map((e) => e.category))),
  ] as Array<'all' | SocialEventCategory>;
  const statuses = [
    'all',
    ...Array.from(new Set(events.map((e) => e.status))),
  ] as Array<'all' | SocialEventStatus>;

  const formatFilterLabel = (value: string): string => {
    if (value === 'all') return 'All';
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select
            value={category}
            onValueChange={(value: 'all' | SocialEventCategory) => {
              setCategory(value);
              setCurrentPage('1');
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {formatFilterLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value: 'all' | SocialEventStatus) => {
              setStatus(value);
              setCurrentPage('1');
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((stat) => (
                <SelectItem key={stat} value={stat}>
                  {formatFilterLabel(stat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortField}
            onValueChange={(value: SortField) => {
              setSortField(value);
              setCurrentPage('1');
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event_date">Event Date</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(value: SortOrder) => {
              setSortOrder(value);
              setCurrentPage('1');
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedEvents.map((event) => (
          <SocialEventCard key={event.id} event={event} />
        ))}
      </div>

      {paginatedEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            No events found matching your filters
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            onClick={() => {
              const newPage = Math.max(1, parseInt(currentPage) - 1).toString();
              setCurrentPage(newPage);
            }}
            disabled={currentPage === '1'}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => {
              const newPage = Math.min(
                totalPages,
                parseInt(currentPage) + 1
              ).toString();
              setCurrentPage(newPage);
            }}
            disabled={parseInt(currentPage) === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
