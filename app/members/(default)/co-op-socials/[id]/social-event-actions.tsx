'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/members/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/members/ui/alert-dialog';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Textarea } from '@/components/members/ui/textarea';
import { Label } from '@/components/members/ui/label';
import { Edit, Info, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/members/ui/checkbox';
import {
  SocialEventWithDetails,
  SocialEventCategory,
  SocialEventStatus,
} from '@/types/members/social';
import { Tooltip } from '@/components/members/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import {
  updateSocialEvent,
  deleteSocialEvent,
} from '@/app/members/actions/social-events/id/social-event-actions';

// --------------
// Helper to parse "HH:MM:SS" or "1.5 hours" into "1.5"
// --------------
function parseIntervalToDecimalString(interval: string | null): string {
  if (!interval) return '';
  // If it includes a colon, assume "HH:MM:SS"
  if (interval.includes(':')) {
    const [hhStr, mmStr, ssStr] = interval.split(':');
    const hh = parseInt(hhStr, 10) || 0;
    const mm = parseInt(mmStr, 10) || 0;
    const ss = parseInt(ssStr, 10) || 0;
    const decimalHours = hh + mm / 60 + ss / 3600;
    return decimalHours.toString();
  } else {
    // e.g. "1.5 hours"
    const [floatStr] = interval.split(' ');
    return parseFloat(floatStr).toString(); // "1.5"
  }
}

interface SocialEventActionsProps {
  event: SocialEventWithDetails;
  onEventUpdate?: (updatedEvent: SocialEventWithDetails | null) => void;
}

export default function SocialEventActions({
  event,
  onEventUpdate,
}: SocialEventActionsProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ----------------------------
  // Parse existing event fields
  // ----------------------------
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [category, setCategory] = useState<SocialEventCategory>(event.category);
  const [status, setStatus] = useState<SocialEventStatus>(event.status);
  const [eventDate, setEventDate] = useState(
    event.event_date
      ? new Date(event.event_date).toISOString().slice(0, 10)
      : ''
  );
  const [startTime, setStartTime] = useState(
    event.start_time ? event.start_time.slice(0, 5) : '' // e.g. "HH:mm"
  );

  // Key fix: parse any "interval" style to "1.5"
  const [duration, setDuration] = useState(() =>
    parseIntervalToDecimalString(event.duration)
  );

  const [location, setLocation] = useState(event.location || '');
  const [openToEveryone, setOpenToEveryone] = useState(event.open_to_everyone);

  // ----------------------------
  // Delete
  // ----------------------------
  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Optimistic UI removal
      onEventUpdate?.(null);

      const { error: deleteError } = await deleteSocialEvent(event.id);
      if (deleteError) throw new Error(deleteError);

      // Navigate back to the list view
      router.push('/members/co-op-socials');
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      // Revert optimistic update on error
      onEventUpdate?.(event);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------
  // Update (Edit)
  // ----------------------------
  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert "1.5" into "1.5 hours" for the DB if you're storing intervals that way
      const finalDuration = duration ? `${duration} hours` : null;

      const optimisticEvent: SocialEventWithDetails = {
        ...event,
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        event_date: eventDate ? new Date(eventDate).toISOString() : null,
        start_time: startTime ? `${startTime}:00` : null,
        duration: finalDuration,
        location: location.trim() || null,
        open_to_everyone: openToEveryone,
        updated_at: new Date().toISOString(),
      };

      // Optimistic UI
      onEventUpdate?.(optimisticEvent);

      // Actual update to DB
      const { data: updatedEvent, error: updateError } =
        await updateSocialEvent({
          id: event.id,
          title,
          description,
          category,
          status,
          event_date: eventDate,
          start_time: startTime,
          duration: finalDuration,
          location,
          open_to_everyone: openToEveryone,
        });

      if (updateError) throw new Error(updateError);
      if (updatedEvent) {
        onEventUpdate?.(updatedEvent);
      }

      setIsEditDialogOpen(false);
      router.refresh(); // Refresh server components
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to update event');
      // Revert optimistic update if error
      onEventUpdate?.(event);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          disabled={isSubmitting}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>

        <DialogContent className="w-[95vw] max-w-lg bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Edit Event
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleEdit} className="space-y-4">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value: SocialEventCategory) =>
                    setCategory(value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="film_night">Film Night</SelectItem>
                    <SelectItem value="album_night">Album Night</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="board_games">Board Games</SelectItem>
                    <SelectItem value="tv">TV</SelectItem>
                    <SelectItem value="book_club">Book Club</SelectItem>
                    <SelectItem value="christmas_dinner">
                      Christmas Dinner
                    </SelectItem>
                    <SelectItem value="bike_ride">Bike Ride</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="hang_out">Hang Out</SelectItem>
                    <SelectItem value="beach">Beach</SelectItem>
                    <SelectItem value="writing_club">Writing Club</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: SocialEventStatus) => setStatus(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_date">Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Duration & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Tooltip
                    content="Enter a decimal: 1.5 = 1½ hours"
                    bg="dark"
                    size="md"
                    position="top"
                  >
                    <Info className="h-4 w-4 text-slate-500" />
                  </Tooltip>
                </div>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={duration}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDuration(value !== '' ? value : '');
                  }}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Open to Everyone */}
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="openToEveryone"
                  label="Open to everyone"
                  checked={openToEveryone}
                  onChange={setOpenToEveryone}
                  disabled={isSubmitting}
                />
                <Tooltip
                  content="Check this box to invite all co-op members and create an event participant list"
                  bg="dark"
                  size="md"
                  position="top"
                  className="ml-2"
                >
                  <Info className="h-4 w-4 text-slate-500" />
                </Tooltip>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="default">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isSubmitting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              event and remove all associated data including participants and
              comments.
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
    </div>
  );
}
