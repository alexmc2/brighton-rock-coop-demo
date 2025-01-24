'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import {
  uploadTaskImage,
  deleteTaskImage,
} from '@/app/members/actions/garden/id/garden-image-actions';
import {
  deleteProject,
  updateProject,
} from '@/app/members/actions/garden/id/project-actions';
import { GardenProject, GardenProjectStatus } from '@/types/members/garden';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/members/ui/select';
import Image from 'next/image';
import { getGardenAreas } from '@/app/members/actions/garden/new-garden-task-actions';

// Status options for a project (change as needed).
const statusOptions = [
  'active',
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
];

interface ProjectActionsProps {
  project: GardenProject & {
    main_image_secure_url?: string | null;
    area_id?: string | null;
  };
  onProjectUpdate?: (
    updatedProject: GardenProject & { main_image_secure_url?: string | null }
  ) => void;
}

export default function ProjectActions({
  project,
  onProjectUpdate,
}: ProjectActionsProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);

  // ------------------
  // Edit Form State
  // ------------------
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<GardenProjectStatus>(project.status);
  const [areaId, setAreaId] = useState(project.area_id || '');
  const [imageUrl, setImageUrl] = useState(project.main_image_secure_url || '');

  // We store a new image file reference
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (isEditDialogOpen) {
      fetchAreas();
    }
  }, [isEditDialogOpen]);

  const fetchAreas = async () => {
    try {
      const areasData = await getGardenAreas();
      setAreas(areasData);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setError('Failed to fetch garden areas');
    }
  };

  useEffect(() => {
    setTitle(project.title);
    setDescription(project.description);
    setStatus(project.status);
    setAreaId(project.area_id || '');
    setImageUrl(project.main_image_secure_url || '');
  }, [project]);

  // ------------------
  // Handle Edit
  // ------------------
  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      // Check current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // If we have a new image, upload it directly using the garden image action
      let newImageData = null;
      if (newImageFile) {
        const formData = new FormData();
        formData.append('file', newImageFile);
        formData.append('projectId', project.id);
        const result = await uploadTaskImage(formData);
        if (result?.image) {
          newImageData = {
            public_id: result.image.public_id,
            secure_url: result.image.secure_url,
          };
        }
      }

      // Optimistic update
      const optimisticProject = {
        ...project,
        title,
        description,
        status,
        area_id: areaId || null,
        main_image_secure_url: newImageFile
          ? URL.createObjectURL(newImageFile)
          : project.main_image_secure_url,
      };
      onProjectUpdate?.(optimisticProject);

      // Actual DB update
      const updated = await updateProject({
        projectId: project.id,
        title,
        description,
        status,
        areaId: areaId || null,
        userId: user.id,
        newImageData,
      });

      setIsEditDialogOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      // Revert optimistic update if error
      onProjectUpdate?.(project);
    } finally {
      setIsUpdating(false);
    }
  }

  // ------------------
  // Handle Delete
  // ------------------
  async function handleDelete() {
    try {
      setIsDeleting(true);
      await deleteProject(project.id);
      router.push('/members/garden?tab=projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

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
              Edit Project
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

            {/* Status & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  onValueChange={(value: GardenProjectStatus) =>
                    setStatus(value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() +
                          option.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="area_id"
                  className="text-slate-900 dark:text-slate-300"
                >
                  Area
                </Label>
                <Select name="area_id" value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select an area" />
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
            </div>

            {/* Current Image Preview */}
            <div className="border rounded-md p-2 mt-2 text-center">
              <Label className="mb-2 block">Current Image</Label>
              <Image
                src={
                  imageUrl ||
                  project.main_image_secure_url ||
                  '/members/images/new-project.webp'
                }
                alt="Project main"
                width={128}
                height={128}
                className="mx-auto object-cover rounded-md"
              />
            </div>

            <div>
              <Label
                htmlFor="new_image"
                className="text-slate-900 dark:text-slate-300"
              >
                Replace Image
              </Label>
              <Input
                id="new_image"
                name="new_image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setNewImageFile(file || null);
                }}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-700"
              />
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
              project and remove all associated data including comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 dark:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
