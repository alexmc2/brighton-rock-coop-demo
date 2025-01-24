'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/members/ui/dialog';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import { Textarea } from '@/components/members/ui/textarea';
import { Info, Plus } from 'lucide-react';
import { SocialEventCategory } from '@/types/members/social';
import { Checkbox } from '@/components/members/ui/checkbox';
import { Tooltip } from '@/components/members/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import { createSocialEvent } from '@/app/members/actions/social-events/new-social-event-modal-actions';

export default function NewSocialEventModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------
  // Form state
  // -----------------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SocialEventCategory>('film_night');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(''); // user enters e.g. "1.5"
  const [location, setLocation] = useState('');
  const [openToEveryone, setOpenToEveryone] = useState(true);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('film_night');
    setEventDate('');
    setStartTime('');
    setDuration('');
    setLocation('');
    setOpenToEveryone(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Pass "1.5 hours" if user typed "1.5"
      const { success, error: createError } = await createSocialEvent({
        title,
        description,
        category,
        eventDate,
        startTime,
        duration, // your server code can do: `${duration} hours`
        location,
        openToEveryone,
      });

      if (!success) throw new Error(createError || 'Failed to create event');

      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Error creating social event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Social Event
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            New Social Event
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-3">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-1">
              <Label htmlFor="title" className="text-sm">
                Title
              </Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="category" className="text-sm">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(value: SocialEventCategory) =>
                  setCategory(value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9">
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
            <Label htmlFor="description" className="text-sm">
              Description
            </Label>
            <Textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="resize-none bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-20"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="event_date" className="text-sm">
                Date
              </Label>
              <Input
                id="event_date"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>
            <div>
              <Label htmlFor="start_time" className="text-sm">
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>
          </div>

          {/* Duration & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Label htmlFor="duration" className="text-sm">
                  Duration (hours)
                </Label>
                <Tooltip
                  content="Enter duration in half-hour increments (e.g., 1 or 1.5)"
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
                onChange={(e) => setDuration(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Label htmlFor="location" className="text-sm">
                  Location
                </Label>
              </div>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>
          </div>

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
                className="ml-1"
              >
                <Info className="h-4 w-4 text-slate-500" />
              </Tooltip>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="default">
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
