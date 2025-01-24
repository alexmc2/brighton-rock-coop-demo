// app/(default)/development/new-project-modal.tsx

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
import { Plus } from 'lucide-react';
import {
  DevelopmentCategory,
  DevelopmentPriority,
} from '@/types/members/development';
import BaseInitiativeForm from '@/components/members/base-initiative-form';
import { createDevelopmentProject } from '@/app/members/actions/development/new-project-actions';

export default function NewProjectModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for BaseInitiativeForm
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DevelopmentCategory>('general');
  const [priority, setPriority] = useState<DevelopmentPriority>('medium');

  // Project-specific state
  const [budget, setBudget] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setPriority('medium');
    setBudget('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { success, error: createError } = await createDevelopmentProject({
        title,
        description,
        category,
        priority,
        budget,
      });

      if (!success) throw new Error(createError || 'Failed to create project');

      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating project:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={() => setIsOpen(true)} variant="default">
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>

      {/* Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 bg-white dark:bg-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-3">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Project Creation Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <BaseInitiativeForm
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              category={category}
              setCategory={setCategory}
              priority={priority}
              setPriority={setPriority}
              initiativeType="project"
              disabled={isSubmitting}
            />

            {/* Form Actions */}
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
                    Create Project
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
