'use client';

import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import { Textarea } from '@/components/members/ui/textarea';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/members/ui/dialog';

interface UploadImageModalProps {
  isUploading: boolean;
  onUpload: (formData: FormData) => Promise<void>;
  onClose: () => void;
}

export function UploadImageModal({
  isUploading,
  onUpload,
  onClose,
}: UploadImageModalProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onUpload(formData);
  };

  return (
    <DialogContent className="dark:bg-slate-800">
      <DialogHeader>
        <DialogTitle>Upload Image</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="file">Image</Label>
          <Input id="file" name="file" type="file" accept="image/*" required />
        </div>

        <div>
          <Label htmlFor="caption">Caption (Optional)</Label>
          <Textarea
            id="caption"
            name="caption"
            placeholder="Add a caption..."
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
