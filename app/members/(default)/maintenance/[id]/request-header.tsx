// app/(default)/maintenance/[id]/request-header.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MaintenanceRequestWithDetails,
  MaintenanceStatus,
} from '@/types/members/maintenance';
import Link from 'next/link';
import { Button } from '@/components/members/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/members/ui/alert-dialog';
import {
  updateMaintenanceStatus,
  deleteMaintenanceRequest,
} from '@/app/members/actions/maintenance/id/request-header-actions';

interface RequestHeaderProps {
  request: MaintenanceRequestWithDetails;
}

export default function RequestHeader({ request }: RequestHeaderProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: MaintenanceStatus) => {
    const colors = {
      pending:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
      scheduled:
        'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
      in_progress:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
      completed:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    };
    return colors[status];
  };

  const handleStatusChange = async (status: MaintenanceStatus) => {
    setIsUpdating(true);
    try {
      await updateMaintenanceStatus(request.id, status);
      router.refresh();
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMaintenanceRequest(request.id);
      router.push('/members/maintenance');
    } catch (err) {
      console.error('Error deleting request:', err);
      setError('Failed to delete request');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const statusOptions: MaintenanceStatus[] = [
    'pending',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
  ];

  return (
    <div className="mb-8">
      <div className="mb-6">
        <Link
          href="/members/maintenance"
          className="text-sm font-medium text-coop-600 hover:text-coop-700 dark:text-sky-400 dark:hover:text-sky-500"
        >
          {'<-'} Back to Maintenance
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded">
          {error}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              maintenance request and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 dark:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
