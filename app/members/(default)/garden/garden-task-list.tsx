// app/(default)/garden/garden-area-list.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  GardenTaskWithDetails,
  GardenTaskStatus,
} from '@/types/members/garden';
import { Button } from '@/components/members/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/members/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import NewGardenTaskModal from './new-garden-task-modal';
import { useQueryState } from 'nuqs';

interface GardenTaskListProps {
  tasks: GardenTaskWithDetails[];
}

const ITEMS_PER_PAGE = 10;

type SortField = 'created_at' | 'due_date';
type SortOrder = 'asc' | 'desc';

export default function GardenTaskList({ tasks }: GardenTaskListProps) {
  // URL state management with nuqs
  const [statusFilter, setStatusFilter] = useQueryState<
    GardenTaskStatus | 'all'
  >('status', {
    defaultValue: 'all',
    parse: (value): 'all' | GardenTaskStatus => value as any,
  });
  const [sortField, setSortField] = useQueryState<SortField>('sortField', {
    defaultValue: 'due_date',
    parse: (value): SortField => value as SortField,
  });
  const [sortOrder, setSortOrder] = useQueryState<SortOrder>('sortOrder', {
    defaultValue: 'asc',
    parse: (value): SortOrder => value as SortOrder,
  });
  const [currentPage, setCurrentPage] = useQueryState('page', {
    defaultValue: '1',
    parse: (value) => value,
  });

  const getStatusColor = (status: GardenTaskStatus) => {
    const colors = {
      pending:
        'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300',
      in_progress:
        'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
      upcoming:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      completed:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800/30 dark:text-cyan-300',
      medium:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300',
      urgent: 'bg-red-50 text-red-700  dark:bg-red-950 dark:text-red-300 ',
    };
    return colors[priority.toLowerCase()] || colors.medium;
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter((task) => statusFilter === 'all' || task.status === statusFilter)
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (!aValue && !bValue) return 0;
      if (!aValue) return sortOrder === 'asc' ? 1 : -1;
      if (!bValue) return sortOrder === 'asc' ? -1 : 1;

      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination calculations
  const totalItems = filteredAndSortedTasks.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedTasks = filteredAndSortedTasks.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Filters and Sort Controls */}
      <div className="mb-6">
        <div className="max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value: GardenTaskStatus | 'all') => {
                setStatusFilter(value);
                setCurrentPage('1');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortField}
              onValueChange={(value: SortField) => {
                setSortField(value);
                setCurrentPage('1');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortOrder}
              onValueChange={(value: SortOrder) => {
                setSortOrder(value);
                setCurrentPage('1');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>

            <div className=" justify-end">
              <NewGardenTaskModal />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700">
        <Table className="min-w-[1000px] w-full divide-y divide-slate-200 dark:divide-slate-700 rounded-lg">
          <TableHeader className="bg-slate-50 dark:bg-slate-900/20 rounded-lg">
            <TableRow>
              <TableHead className="w-[20%] px-8 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                Job Title
              </TableHead>
              <TableHead className="w-[12%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                Status
              </TableHead>
              <TableHead className="w-[12%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                Priority
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                Job Type
              </TableHead>
              <TableHead className="w-[14%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                Date/Deadline
              </TableHead>
              {/* <TableHead className="w-[12%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                Assigned To
              </TableHead> */}
              <TableHead className="w-[10%] px-4 py-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                Participants
              </TableHead>
              <TableHead className="w-[10%] px-4 py-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                Comments
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="px-8 py-3">
                  <Link
                    href={`/members/garden/${task.id}`}
                    className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-sky-400 dark:hover:text-green-300"
                  >
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div
                    className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {task.status.charAt(0).toUpperCase() +
                      task.status.slice(1).replace('_', ' ')}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div
                    className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {task.area?.name || '-'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  {task.due_date
                    ? format(new Date(task.due_date), 'MMM d, yyyy h:mm a')
                    : '-'}
                </TableCell>
                {/* <TableCell className="px-4 py-3">
                  {task.assigned_to && task.assigned_to.trim()
                    ? task.assigned_to
                    : '-'}
                </TableCell> */}
                <TableCell className="px-4 py-3 text-center">
                  {task.participants?.filter((p) => p.status === 'helping')
                    .length || 0}
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  {task.comments?.length || 0}
                </TableCell>
              </TableRow>
            ))}
            {paginatedTasks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500 dark:text-slate-400"
                >
                  No tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <nav
                className="mb-4 sm:mb-0 sm:order-1"
                role="navigation"
                aria-label="Navigation"
              >
                <ul className="flex justify-center">
                  <li className="ml-3 first:ml-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = Math.max(
                          1,
                          parseInt(currentPage) - 1
                        ).toString();
                        setCurrentPage(newPage);
                      }}
                      disabled={currentPage === '1'}
                    >
                      Previous
                    </Button>
                  </li>
                  <li className="ml-3 first:ml-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = Math.min(
                          totalPages,
                          parseInt(currentPage) + 1
                        ).toString();
                        setCurrentPage(newPage);
                      }}
                      disabled={parseInt(currentPage) === totalPages}
                    >
                      Next
                    </Button>
                  </li>
                </ul>
              </nav>
              <div className="text-sm text-gray-500 text-center sm:text-left">
                Showing{' '}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {endIndex}
                </span>{' '}
                of{' '}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {totalItems}
                </span>{' '}
                results
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
