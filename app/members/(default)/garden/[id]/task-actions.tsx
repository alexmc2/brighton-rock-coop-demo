'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  GardenTaskPriority,
  GardenTaskStatus,
  GardenTaskWithDetails,
} from '@/types/members/garden';
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
import { Edit, Trash2 } from 'lucide-react';
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
  updateGardenTask,
  deleteGardenTask,
} from '@/app/members/actions/garden/id/task-actions';

interface TaskActionsProps {
  task: GardenTaskWithDetails;
  onTaskUpdate?: (updatedTask: GardenTaskWithDetails) => void;
}

// Helper to parse "HH:MM:SS" into a decimal hour string
function parseIntervalToDecimal(intervalString: string): string {
  if (!intervalString) return '';
  // Typically returned as "HH:MM:SS" from Postgres
  const [hhStr, mmStr, ssStr] = intervalString.split(':');
  const hh = parseInt(hhStr, 10) || 0;
  const mm = parseInt(mmStr, 10) || 0;
  const ss = parseInt(ssStr, 10) || 0;
  const decimalHours = hh + mm / 60 + ss / 3600; // e.g. 1.5 for "01:30:00"
  return decimalHours.toString();
}

export default function TaskActions({ task, onTaskUpdate }: TaskActionsProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClientComponentClient();

  // ------------------
  // Edit Form State
  // ------------------
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [areaId, setAreaId] = useState(task.area_id);
  const [priority, setPriority] = useState<GardenTaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  );
  const [scheduledTime, setScheduledTime] = useState(task.scheduled_time || '');

  // Key fix: parse "HH:MM:SS" → "1.5"
  const [duration, setDuration] = useState(() => {
    if (!task.duration) return '';
    return parseIntervalToDecimal(task.duration); // e.g. "01:30:00" -> "1.5"
  });

  const [assignedTo, setAssignedTo] = useState(task.assigned_to ?? 'Everyone');
  const [status, setStatus] = useState<GardenTaskStatus>(task.status);

  // Update form state if the task changes externally
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setAreaId(task.area_id);
    setPriority(task.priority);
    setDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
    );
    setScheduledTime(task.scheduled_time || '');
    setDuration(task.duration ? parseIntervalToDecimal(task.duration) : '');
    setAssignedTo(task.assigned_to ?? 'Everyone');
    setStatus(task.status);
  }, [task]);

  useEffect(() => {
    async function fetchAreas() {
      try {
        const areasData = await getGardenAreas();
        setAreas(areasData);
      } catch (err) {
        console.error('Error fetching areas:', err);
      }
    }
    fetchAreas();
  }, []);

  // ------------------
  // Handle Edit Submit
  // ------------------
  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      setError(null);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Optimistic update
      const optimisticTask: GardenTaskWithDetails = {
        ...task,
        title,
        description,
        area_id: areaId,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        scheduled_time: scheduledTime || null,
        assigned_to: assignedTo || 'Everyone',
        status,
        // Convert typed decimal string (e.g. "1.5") to "1.5 hours" for Postgres:
        duration: duration ? duration + ' hours' : null,
        updated_at: new Date().toISOString(),
      };

      onTaskUpdate?.(optimisticTask);

      // Actual DB update
      const { updatedTask, profile } = await updateGardenTask({
        taskId: task.id,
        title,
        description,
        areaId,
        priority,
        dueDate: dueDate || null,
        scheduledTime: scheduledTime || null,
        assignedTo,
        status,
        duration: duration || null, // Pass the raw decimal as string
        userId: user.id,
      });

      // If there's a date, ensure there's a calendar event
      if (dueDate) {
        await createGardenTaskEvent(
          title,
          description,
          dueDate,
          scheduledTime || null,
          duration || null,
          user.id,
          profile.full_name,
          task.id
        );
      }

      setIsEditDialogOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      // Revert optimistic update if error
      onTaskUpdate?.(task);
    } finally {
      setIsUpdating(false);
    }
  };

  // ------------------
  // Handle Delete
  // ------------------
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteGardenTask(task.id);
      router.push('/members/garden');
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // ------------------
  // JSX Return
  // ------------------
  return (
    <div className="flex items-center gap-2 mt-4">
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          disabled={isUpdating || isDeleting}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>

        <DialogContent className="w-[95vw] max-w-lg bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Edit Task
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleEdit} className="space-y-4">
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
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
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
                <Select name="area_id" value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select a job type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh] overflow-y-auto">
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} variant="default">
                {isUpdating ? 'Saving...' : 'Save Changes'}
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
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              task and remove all associated data including comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 dark:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
