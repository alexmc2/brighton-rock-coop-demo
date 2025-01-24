// app/(default)/calendar/new-event-modal.tsx

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/members/ui/dialog';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Textarea } from '@/components/members/ui/textarea';
import { Label } from '@/components/members/ui/label';
import { Plus, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import { createManualCalendarEvent } from '@/app/members/actions/calendar/event-creation-actions';
import { Tooltip } from '@/components/members/ui/tooltip';

export default function NewEventModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formStartTime = new Date(`${date}T${startTime}:00`);

      let endTime: Date;
      const durationHours = parseFloat(duration);

      if (durationHours >= 24) {
        // Set end time to the end of the day
        endTime = new Date(formStartTime);
        endTime.setHours(23, 59, 59);
      } else {
        // Add duration hours to start time
        endTime = new Date(
          formStartTime.getTime() + durationHours * 60 * 60 * 1000
        );
      }

      // Get the current user and their profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the user's profile to get their full name
      const { data: profile } = await supabase
        .from('demo_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Use the server action to create the event
      await createManualCalendarEvent(
        title,
        description,
        formStartTime,
        endTime,
        category,
        user.id,
        profile?.full_name || null
      );

      setIsOpen(false);
      router.refresh();
      // Reset form fields
      setTitle('');
      setDescription('');
      setDate('');
      setStartTime('');
      setDuration('');
      setCategory('');
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsOpen(true)} variant="default">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-lg bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Title Field */}
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
                required
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Description Field */}
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
                placeholder="Event description"
                className="resize-none bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date and Time Fields */}
            <div className="grid grid-cols-2 gap-4">
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
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
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
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Duration Field */}
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
                type="number"
                min="0"
                step="0.5"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>

            {/* Category Field */}
            <div>
              <Label
                htmlFor="category"
                className="text-slate-900 dark:text-slate-300"
              >
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Meeting">
                    General Meeting
                  </SelectItem>
                  <SelectItem value="Sub Meeting">Sub Meeting</SelectItem>
                  <SelectItem value="Allocations">Allocations</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="P4P Visit">P4P Visit</SelectItem>
                  <SelectItem value="Garden">Garden</SelectItem>
                  <SelectItem value="AGM">AGM</SelectItem>
                  <SelectItem value="EGM">EGM</SelectItem>
                  <SelectItem value="General Maintenance">
                    General Maintenance
                  </SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Treasury">Treasury</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="default">
                {isSubmitting ? (
                  'Creating...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
