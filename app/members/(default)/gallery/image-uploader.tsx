// components/members/gallery/image-uploader.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { UploadIcon } from '@radix-ui/react-icons';
import { uploadImage } from '@/app/members/actions/gallery/image-actions';

interface ImageUploaderProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function ImageUploader({
  onSuccess,
  onError,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadImage(formData);
      if (!result) {
        throw new Error('Upload failed');
      }
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      } else {
        onError('Failed to upload image');
      }
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-4 w-44 max-w-xs">
      <Button
        variant="default"
        className="w-full relative"
        disabled={isUploading}
      >
        <Input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center justify-center gap-2">
          <UploadIcon className={isUploading ? 'animate-spin' : ''} />
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </div>
      </Button>
    </div>
  );
}
