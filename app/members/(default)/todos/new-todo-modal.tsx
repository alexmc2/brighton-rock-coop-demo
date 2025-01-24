// app/(default)/todos/new-todo-modal.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import { Plus } from 'lucide-react';
import {
  createTodo,
  fetchProfiles,
} from '@/app/members/actions/todos/new-todo-modal-actions';

// Define the Profile type based on your profiles table
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

export default function NewTodoModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // **State Variables for Controlled Inputs**
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [todoType, setTodoType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  // **State for User Profiles**
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);

  // **Function to Fetch Profiles**
  const loadProfiles = async () => {
    setIsFetchingProfiles(true);
    setError(null);
    try {
      const result = await fetchProfiles();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profiles');
      }
      setProfiles(result.data || []);
    } catch (err) {
      console.error('Unexpected error fetching profiles:', err);
      setError('An unexpected error occurred while fetching profiles.');
    } finally {
      setIsFetchingProfiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createTodo({
        title,
        description,
        todoType: todoType as 'general' | 'minuted',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        assignedTo,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create todo');
      }

      // Reset Form Fields
      setTitle('');
      setDescription('');
      setTodoType('general');
      setPriority('medium');
      setAssignedTo(null);

      // Close Modal
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating todo:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create todo'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* **Trigger Button to Open Modal and Fetch Profiles** */}
      <Button
        onClick={() => {
          setIsOpen(true);
          loadProfiles(); // Fetch profiles when modal opens
        }}
        variant="default"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Todo
      </Button>

      {/* **Modal Dialog** */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-lg bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>New Todo</DialogTitle>
          </DialogHeader>

          {/* **Error Message** */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* **Todo Creation Form** */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* **Title Field** */}
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
                placeholder="Enter todo title"
                value={title}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* **Description Field** */}
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
                required
                placeholder="Enter todo description"
                className="resize-none bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* **Todo Type Field** */}
            <div>
              <Label
                htmlFor="todo_type"
                className="text-slate-900 dark:text-slate-300"
              >
                Todo Type
              </Label>
              <Select
                value={todoType}
                onValueChange={(value: string) => setTodoType(value)}
              >
                <SelectTrigger
                  id="todo_type"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                >
                  <SelectValue placeholder="Select todo type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="minuted">Minuted Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* **Priority Field** */}
            <div>
              <Label
                htmlFor="priority"
                className="text-slate-900 dark:text-slate-300"
              >
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(value: string) => setPriority(value)}
              >
                <SelectTrigger
                  id="priority"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* **Assign To Field** */}
            <div>
              <Label
                htmlFor="assigned_to"
                className="text-slate-900 dark:text-slate-300"
              >
                Assign To
              </Label>
              <Select
                value={assignedTo || 'unassigned'}
                onValueChange={(value: string) =>
                  setAssignedTo(value === 'unassigned' ? null : value)
                }
                disabled={isFetchingProfiles}
              >
                <SelectTrigger
                  id="assigned_to"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
                >
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {isFetchingProfiles ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || profile.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
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
                    Create Todo
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
