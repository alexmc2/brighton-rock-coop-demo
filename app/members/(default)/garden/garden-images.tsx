'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { GardenImage } from '@/types/members/garden';
import { Button } from '@/components/members/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2 as Trash2Icon,
  Download as DownloadIcon,
} from 'lucide-react';
import ZoomableImage from '@/app/members/(default)/gallery/zoomable-image';
import { ImageGridSkeleton } from '@/app/members/(default)/gallery/image-grid-skeleton';
import { Dialog, DialogTrigger } from '@/components/members/ui/dialog';
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
import {
  uploadTaskImage,
  deleteTaskImage,
} from '@/app/members/actions/garden/id/garden-image-actions';
import { UploadImageModal } from './upload-image-modal';

interface GardenImagesProps {
  resourceId: string;
  images: GardenImage[];
  isProject?: boolean;
}

// Helper function to sort images by creation date
const sortImagesByDate = (images: GardenImage[]): GardenImage[] => {
  return [...images].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export default function GardenImages({
  resourceId,
  images: initialImages,
  isProject = false,
}: GardenImagesProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [imageToDownload, setImageToDownload] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  const handleUpload = async (formData: FormData) => {
    setIsUploading(true);
    setError(null);

    try {
      // Add the appropriate ID field based on resource type
      formData.append(isProject ? 'projectId' : 'taskId', resourceId);
      await uploadTaskImage(formData);
      setIsUploadModalOpen(false);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
      router.refresh();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (imageId: string) => {
    setImageToDelete(imageId);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTaskImage(imageToDelete);
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setImageToDelete(null);
    }
  };

  const handleDownloadClick = (imageUrl: string, fileName: string) => {
    setImageToDownload({ url: imageUrl, name: fileName });
    setShowDownloadDialog(true);
  };

  const handleDownload = async () => {
    if (!imageToDownload) return;

    try {
      const response = await fetch(imageToDownload.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageToDownload.name}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Image download started',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download image',
        variant: 'destructive',
      });
    } finally {
      setShowDownloadDialog(false);
      setImageToDownload(null);
    }
  };

  if (isLoading) {
    return <ImageGridSkeleton />;
  }

  const sortedImages = sortImagesByDate(initialImages || []);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-600 dark:text-slate-100">
            Images ({sortedImages?.length || 0})
          </h2>
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Image
              </Button>
            </DialogTrigger>
            <UploadImageModal
              isUploading={isUploading}
              onUpload={handleUpload}
              onClose={() => setIsUploadModalOpen(false)}
            />
          </Dialog>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 mb-4">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Image Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
          {sortedImages?.map((image, index) => (
            <div
              key={image.id}
              className="relative group mb-4 break-inside-avoid"
            >
              <ZoomableImage
                src={image.secure_url}
                alt={
                  image.caption ||
                  `Garden ${isProject ? 'project' : 'task'} image`
                }
                className="rounded-lg cursor-pointer w-full h-auto"
                priority={index < 6}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={100}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="default"
                  size="icon"
                  className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                  onClick={() =>
                    handleDownloadClick(
                      image.secure_url,
                      `garden-${isProject ? 'project' : 'task'}-image-${
                        image.id
                      }`
                    )
                  }
                >
                  <DownloadIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 ease-in-out"
                  onClick={() => handleDeleteClick(image.id)}
                  disabled={isDeleting}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
              {image.caption && (
                <div className="p-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {image.caption}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {image.user?.full_name ||
                        image.user?.email ||
                        'Unknown user'}
                    </span>
                    <span>
                      {format(new Date(image.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!sortedImages || sortedImages.length === 0) && (
            <div className="col-span-full text-center py-4 text-sm text-slate-500 dark:text-slate-400">
              No images yet
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Confirmation Dialog */}
      <AlertDialog
        open={showDownloadDialog}
        onOpenChange={setShowDownloadDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Image</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to download this image?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownload}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
