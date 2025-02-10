'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import {
  MaintenanceRequestWithDetails,
  MaintenancePriority,
  MaintenanceStatus,
} from '@/types/members/maintenance';
import { House } from '@/types/members/house';
import VisitForm from './visit-form';
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
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import { Textarea } from '@/components/members/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/members/ui/card';
import {
  getUsers,
  updateMaintenanceRequest,
  updateMaintenanceVisit,
  deleteMaintenanceVisit,
} from '@/app/members/actions/maintenance/id/request-details-actions';
import { deleteMaintenanceRequest } from '@/app/members/actions/maintenance/id/request-header-actions';

interface RequestDetailsProps {
  request: MaintenanceRequestWithDetails;
  houses: House[];
}

export default function RequestDetails({
  request,
  houses,
}: RequestDetailsProps) {
  const router = useRouter();
  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [editingVisit, setEditingVisit] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const supabase = createClientComponentClient();
  const now = new Date();

  // Form state for editing the request
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [priority, setPriority] = useState<MaintenancePriority>(
    request.priority
  );
  const [status, setStatus] = useState<MaintenanceStatus>(request.status);
  const [houseId, setHouseId] = useState(request.house_id);
  const [assignedTo, setAssignedTo] = useState<string | null>(
    request.assigned_to
  );

  // Get list of users for assignment
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; full_name: string | null }>
  >([]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getUsers();
        setUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Separate visits into upcoming and past
  const upcomingVisits = request.visits
    .filter((v) => !v.completed_at && new Date(v.scheduled_date) > now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_date).getTime() -
        new Date(b.scheduled_date).getTime()
    );

  const pastVisits = request.visits
    .filter((v) => v.completed_at || new Date(v.scheduled_date) <= now)
    .sort(
      (a, b) =>
        new Date(b.scheduled_date).getTime() -
        new Date(a.scheduled_date).getTime()
    );

  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);

  const handleRequestUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateMaintenanceRequest(request.id, {
        title,
        description,
        priority,
        status,
        house_id: houseId,
        assigned_to: assignedTo,
      });

      setIsEditingRequest(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating request:', err);
      setError('Failed to update request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisitUpdate = async (
    visitId: string,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setError(null);

    try {
      await updateMaintenanceVisit(
        visitId,
        request.title,
        {
          scheduled_date: '', // These will be extracted from formData in the action
          estimated_duration: '',
          notes: null,
        },
        formData
      );

      setEditingVisit(null);
      router.refresh();
    } catch (err) {
      console.error('Error updating visit:', err);
      setError(err instanceof Error ? err.message : 'Failed to update visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisitDelete = async (visitId: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteMaintenanceVisit(visitId);
      router.refresh();
    } catch (err) {
      console.error('Error deleting visit:', err);
      setError('Failed to delete visit');
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
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

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-lg">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row sm:flex-row gap-2">
            <Button
              onClick={() => setIsEditingRequest(!isEditingRequest)}
              variant="default"
              size="sm"
              className="w-full sm:w-auto"
            >
              {isEditingRequest ? 'Cancel Edit' : 'Edit Details'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
          <CardTitle>
            <h1 className="text-xl py-2 font-bold text-slate-800 dark:text-slate-100">
              {request.title}
            </h1>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="">
          {error && (
            <div className="mb-4 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded">
              {error}
            </div>
          )}

          {isEditingRequest ? (
            <form onSubmit={handleRequestUpdate} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              {/* House */}
              <div className="space-y-2">
                <Label htmlFor="house_id">House</Label>
                <Select value={houseId} onValueChange={setHouseId}>
                  <SelectTrigger id="house_id">
                    <SelectValue placeholder="Select a house" />
                  </SelectTrigger>
                  <SelectContent>
                    {houses
                      .filter((house) => !house.virtual)
                      .map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          {house.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as MaintenancePriority)
                  }
                >
                  <SelectTrigger id="priority">
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

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as MaintenanceStatus)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select
                  value={assignedTo || 'unassigned'}
                  onValueChange={(value) =>
                    setAssignedTo(value === 'unassigned' ? null : value)
                  }
                >
                  <SelectTrigger id="assigned_to">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Not Assigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditingRequest(false)}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} variant="default">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Description
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {request.description}
                </p>
              </div>

              {/* House */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  House
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {request.house.name}
                </p>
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Priority
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {request.priority.charAt(0).toUpperCase() +
                    request.priority.slice(1)}
                </p>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Status
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1).replace('_', ' ')}
                </p>
              </div>

              {/* Assigned To */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Assigned To
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {request.assigned_to_user
                    ? request.assigned_to_user.full_name ||
                      request.assigned_to_user.email
                    : 'Not Assigned'}
                </p>
              </div>

              {/* Reported By */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Reported By
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {request.reported_by_user.full_name ||
                    request.reported_by_user.email}
                </p>
              </div>

              {/* Date Reported */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Date Reported
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          )}

          {/* Visit History */}
          <div className="mt-6 ">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Visit History
            </h3>
            <div className="space-y-3 ">
              {upcomingVisits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                    Upcoming Visits:
                  </h4>
                  {upcomingVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex flex-col sm:flex-row items-start p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg mb-2"
                    >
                      {editingVisit === visit.id ? (
                        <VisitForm
                          visit={visit}
                          onSubmit={(e) => handleVisitUpdate(visit.id, e)}
                          onCancel={() => setEditingVisit(null)}
                          isSubmitting={isSubmitting}
                        />
                      ) : (
                        <>
                          <div className="grow p-1 w-full">
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                              {format(
                                new Date(visit.scheduled_date),
                                'MMM d, yyyy'
                              )}{' '}
                              at{' '}
                              {format(new Date(visit.scheduled_date), 'h:mm a')}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              Estimated Duration: {visit.estimated_duration}
                            </div>
                            {visit.notes && (
                              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                Notes: {visit.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-2 sm:mt-0 w-full sm:w-auto">
                            <Button
                              onClick={() => setEditingVisit(visit.id)}
                              variant="default"
                              size="xs"
                              className="flex-1 sm:flex-none"
                            >
                              Edit Visit
                            </Button>
                            <Button
                              onClick={() => {
                                setVisitToDelete(visit.id);
                                setShowDeleteDialog(true);
                              }}
                              variant="destructive"
                              size="xs"
                              className="flex-1 sm:flex-none"
                            >
                              Delete Visit
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {pastVisits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 ">
                    Past Visits:
                  </h4>
                  {pastVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-start p-3 bg-slate-50 dark:bg-slate-900  rounded-lg mb-2"
                    >
                      <div className="grow p-1">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                          {format(
                            new Date(visit.scheduled_date),
                            'MMM d, yyyy h:mm a'
                          )}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          Estimated Duration: {visit.estimated_duration}
                        </div>
                        {visit.notes && (
                          <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            Notes: {visit.notes}
                          </div>
                        )}
                      </div>
                      {visit.completed_at && (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark-text-sky-200">
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {request.visits.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No visits scheduled yet
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
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
    </Card>
  );
}
