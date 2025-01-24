// app/(default)/garden/new-garden-task-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/members/ui/dialog';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Textarea } from '@/components/members/ui/textarea';
import { Label } from '@/components/members/ui/label';
import { GardenTaskPriority, GardenTaskStatus } from '@/types/members/garden';
import { Plus } from 'lucide-react';
import { createGardenTaskEvent } from '@/app/members/actions/calendar/calendar-page-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import {
  getGardenAreas,
  createGardenTask,
} from '@/app/members/actions/garden/new-garden-task-actions';

export default function NewGardenTaskModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const supabase = createClientComponentClient();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState('');
  const [priority, setPriority] = useState<GardenTaskPriority>('medium');
  const [status, setStatus] = useState<GardenTaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('');
  const [assignedTo, setAssignedTo] = useState('Everyone');

  useEffect(() => {
    if (isOpen) {
      fetchAreas();
    }
  }, [isOpen]);

  const fetchAreas = async () => {
    try {
      const areasData = await getGardenAreas();
      setAreas(areasData);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setError('Failed to fetch garden areas');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { newTask, profile } = await createGardenTask({
        title,
        description,
        areaId,
        priority,
        status,
        dueDate,
        scheduledTime,
        assignedTo,
        duration,
        userId: user.id,
      });

      if (dueDate && newTask) {
        await createGardenTaskEvent(
          newTask.title,
          newTask.description,
          newTask.due_date,
          newTask.scheduled_time,
          duration,
          user.id,
          profile.full_name,
          newTask.id
        );
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create task'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setIsOpen(true);
            }}
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Job
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 bg-white dark:bg-slate-800 max-h-[90vh]  overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Garden Job</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label
                htmlFor="title"
                className="text-slate-900 dark:text-slate-300 text-sm"
              >
                Title
              </Label>
              <Input
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter job title"
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-9"
              />
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-slate-900 dark:text-slate-300 text-sm"
              >
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter job description"
                className="resize-none bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 h-20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="area_id"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Job Type
                </Label>
                <Select
                  name="area_id"
                  value={areaId}
                  onValueChange={setAreaId}
                  required
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select a job type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh] overflow-y-auto">
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id || 'default'}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="priority"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Priority
                </Label>
                <Select
                  name="priority"
                  value={priority}
                  onValueChange={(value: GardenTaskPriority) =>
                    setPriority(value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="status"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Status
                </Label>
                <Select
                  name="status"
                  value={status}
                  onValueChange={(value: GardenTaskStatus) => setStatus(value)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="assigned_to"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Assigned To
                </Label>
                <Input
                  id="assigned_to"
                  name="assigned_to"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Enter any name"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <Label
                  htmlFor="due_date"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Date
                </Label>
                <Input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>

              <div>
                <Label
                  htmlFor="scheduled_time"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Time
                </Label>
                <Input
                  type="time"
                  id="scheduled_time"
                  name="scheduled_time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700 [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>

              <div>
                <Label
                  htmlFor="duration"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Duration (hours)
                </Label>
                <Input
                  type="number"
                  id="duration"
                  name="duration"
                  min="0"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
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
                    <Plus className="h-4 w-4 mr-1" />
                    Create Job
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
