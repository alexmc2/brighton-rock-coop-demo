// app/(default)/calendar/event-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/members/ui/dialog';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Textarea } from '@/components/members/ui/textarea';
import { Label } from '@/components/members/ui/label';
import { CalendarEventWithDetails } from '@/types/members/calendar';
import { Pencil, Trash2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCalendarStore } from '@/lib/members/stores/calendar-store';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/members/ui/alert-dialog';
import {
  getEventDetails,
  updateEvent,
  deleteEvent,
  getCurrentUser,
  getMaintenanceRequestId,
} from '@/app/members/actions/calendar/event-edit-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import { Tooltip } from '@/components/members/ui/tooltip';

export default function EventModal() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<CalendarEventWithDetails | null>(null);
  const { selectedEventId, setSelectedEventId } = useCalendarStore();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (selectedEventId) {
        const eventData = await getEventDetails(selectedEventId);
        if (eventData) {
          setEvent(eventData);
        }
      } else {
        setEvent(null);
        setIsEditing(false);
      }
    }

    fetchEvent();
  }, [selectedEventId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !event) return;

    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const startTime = new Date(
        `${formData.get('date')}T${formData.get('start_time')}:00`
      );

      let endTime: Date;
      const duration = formData.get('duration') as string;

      if (duration === 'All day') {
        // Set end time to the end of the day
        endTime = new Date(startTime);
        endTime.setHours(23, 59, 59);
      } else {
        // Add duration hours to start time
        const durationHours = parseFloat(duration);
        endTime = new Date(
          startTime.getTime() + durationHours * 60 * 60 * 1000
        );
      }

      const user = await getCurrentUser();

      await updateEvent({
        eventId: event.id,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        startTime,
        endTime,
        userId: user.id,
      });

      setIsEditing(false);
      setSelectedEventId(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    try {
      setIsSubmitting(true);
      await deleteEvent(event.id, event.reference_id);
      setSelectedEventId(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSourceClick = async () => {
    if (!event?.reference_id) return;

    setSelectedEventId(null);
    if (event.event_type === 'maintenance_visit') {
      const requestId = await getMaintenanceRequestId(event.reference_id);
      if (requestId) {
        router.push(`/members/maintenance/${requestId}`);
      }
    } else {
      const routes = {
        garden_task: '/members/garden',
        development_event: '/members/development',
        social_event: '/members/co-op-socials',
      } as const;

      const route = routes[event.event_type as keyof typeof routes];
      if (route) {
        router.push(`${route}/${event.reference_id}`);
      }
    }
  };

  if (!event) return null;

  // Determine if the event can be edited/deleted
  const canModify =
    event.event_type === 'manual' ||
    [
      'General Meeting',
      'Sub Meeting',
      'Allocations',
      'P4P Visit',
      'Garden',
      'AGM',
      'EGM',
      'General Maintenance',
      'Training',
      'Treasury',
      'Miscellaneous',
    ].includes(event.event_type);

  return (
    <Dialog
      open={!!selectedEventId}
      onOpenChange={(open) => !open && setSelectedEventId(null)}
    >
      <DialogContent className="w-full max-w-lg bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Edit Event' : event.title}</span>
            {!isEditing && canModify && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="title"
                className="text-slate-900 dark:text-slate-300"
              >
                Title
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={event.title}
                required
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-slate-900 dark:text-slate-300"
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={event.description || ''}
                className="resize-none bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="date"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Date
                </Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  defaultValue={format(
                    new Date(event.start_time),
                    'yyyy-MM-dd'
                  )}
                  required
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>

              <div>
                <Label
                  htmlFor="start_time"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Start Time
                </Label>
                <Input
                  type="time"
                  id="start_time"
                  name="start_time"
                  defaultValue={format(new Date(event.start_time), 'HH:mm')}
                  required
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Label
                  htmlFor="duration"
                  className="text-slate-900 dark:text-slate-300 text-sm"
                >
                  Duration (hours)
                </Label>
                <Tooltip
                  content="Enter duration in steps of 0.5 hours (e.g., 1 = one hour, 1.5 = one and half hours)"
                  bg="dark"
                  size="md"
                  position="top"
                >
                  <Info className="h-4 w-4 text-slate-500" />
                </Tooltip>
              </div>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="0"
                step="0.5"
                required
                defaultValue={(() => {
                  const durationMs =
                    new Date(event.end_time).getTime() -
                    new Date(event.start_time).getTime();
                  const durationHours = durationMs / (1000 * 60 * 60);
                  return durationHours >= 24 ? 24 : durationHours;
                })()}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="default">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Description
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {event.description || 'No description provided'}
              </p>
            </div>

            <div>
              <Label className="text-slate-900 dark:text-slate-300">Time</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {format(new Date(event.start_time), 'MMMM d, yyyy h:mm a')} -{' '}
                {format(new Date(event.end_time), 'h:mm a')}
              </p>
            </div>

            <div>
              <Label className="text-slate-900 dark:text-slate-300">
                Event Type
              </Label>
              <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                {event.event_type.replace('_', ' ')}
              </p>
            </div>

            {event.event_type !== 'manual' && event.reference_id && (
              <div>
                <Label className="text-slate-900 dark:text-slate-300">
                  Source
                </Label>
                <div className="mt-1">
                  <Button
                    variant="ghost"
                    className="h-auto px-0 text-sm font-medium text-coop-600 dark:text-sky-500 hover:text-coop-800 dark:hover:text-sky-300 hover:bg-transparent"
                    onClick={handleSourceClick}
                  >
                    {event.event_type === 'maintenance_visit'
                      ? 'View visit in maintenance'
                      : `View event in ${event.category
                          .split('_')[0]
                          .toLowerCase()}`}
                  </Button>
                </div>
              </div>
            )}

            {event.created_by_user && (
              <div>
                <Label>Created By</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {event.created_by_user.full_name ||
                    event.created_by_user.email}
                </p>
              </div>
            )}

            {event.last_modified_by_user && (
              <div>
                <Label>Last Modified By</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {event.last_modified_by_user.full_name ||
                    event.last_modified_by_user.email}
                </p>
              </div>
            )}
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                event.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 dark:bg-red-600"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Event'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
