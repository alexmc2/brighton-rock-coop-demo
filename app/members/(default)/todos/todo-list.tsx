// app/(default)/todos/todo-list.tsx

'use client';

import { useQueryState } from 'nuqs';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/members/ui/table';
import {
  TodoWithDetails,
  TodoPriority,
  TodoStatus,
  TodoCategory,
} from '@/types/members/todos';
import { Button } from '@/components/members/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';

interface TodoListProps {
  tasks: TodoWithDetails[];
}

type SortOrder = 'created_asc' | 'created_desc';

const ITEMS_PER_PAGE = 10;

export default function TodoList({ tasks }: TodoListProps) {
  // State management with URL parameters
  const [status, setStatus] = useQueryState('status', {
    defaultValue: 'all',
    parse: (value): 'all' | TodoStatus => value as any,
  });
  const [todoType, setTodoType] = useQueryState('type', {
    defaultValue: 'all',
    parse: (value): 'all' | TodoCategory => value as any,
  });
  const [priority, setPriority] = useQueryState('priority', {
    defaultValue: 'all',
    parse: (value): 'all' | TodoPriority => value as any,
  });
  const [sortOrder, setSortOrder] = useQueryState<SortOrder>('sortOrder', {
    defaultValue: 'created_desc',
    parse: (value): SortOrder => value as SortOrder,
  });
  const [currentPage, setCurrentPage] = useQueryState('page', {
    defaultValue: '1',
    parse: (value) => value,
  });

  // Filter tasks based on selected filters
  const filteredTasks = tasks
    .filter((task) => {
      if (status !== 'all' && task.status !== status) return false;
      if (todoType !== 'all' && task.todo_type !== todoType) return false;
      if (priority !== 'all' && task.priority !== priority) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'created_desc' ? dateB - dateA : dateA - dateB;
    });

  // Calculate pagination
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Handle page changes
  const goToNextPage = () => {
    if (parseInt(currentPage) < totalPages) {
      setCurrentPage((parseInt(currentPage) + 1).toString());
    }
  };

  const goToPreviousPage = () => {
    if (parseInt(currentPage) > 1) {
      setCurrentPage((parseInt(currentPage) - 1).toString());
    }
  };

  // Reset pagination when filters change
  const handleFilterChange = (
    filterType: 'status' | 'type' | 'priority' | 'sort',
    value: string
  ) => {
    setCurrentPage('1'); // Reset to first page
    switch (filterType) {
      case 'status':
        setStatus(value as 'all' | TodoStatus);
        break;
      case 'type':
        setTodoType(value as 'all' | TodoCategory);
        break;
      case 'priority':
        setPriority(value as 'all' | TodoPriority);
        break;
      case 'sort':
        setSortOrder(value as SortOrder);
        break;
    }
  };

  const getStatusColor = (status: TodoStatus) => {
    const colors = {
      pending:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
      in_progress:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
      completed:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
      todo: 'bg-gray-100 dark:bg-slate-900/50 text-gray-800 dark:text-gray-200',
    } as const;
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: TodoPriority) => {
    const colors = {
      low: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
      medium:
        'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20',
      urgent: 'bg-red-100 text-red-600 dark:text-red-400 dark:bg-red-600/20',
    } as const;
    return colors[priority] || colors.medium;
  };

  const formatFilterLabel = (value: string): string => {
    if (value === 'all') return 'All';
    return value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <div className="max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Status Filter */}
            <Select
              value={status}
              onValueChange={(value: 'all' | TodoStatus) => {
                handleFilterChange('status', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['pending', 'in_progress', 'completed', 'cancelled'].map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {formatFilterLabel(status)}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={todoType}
              onValueChange={(value: 'all' | TodoCategory) => {
                handleFilterChange('type', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="minuted">Minuted Actions</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={priority}
              onValueChange={(value: 'all' | TodoPriority) => {
                handleFilterChange('priority', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {formatFilterLabel(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select
              value={sortOrder}
              onValueChange={(value: SortOrder) => {
                handleFilterChange('sort', value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest First</SelectItem>
                <SelectItem value="created_asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="relative w-full">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <Table className="min-w-[1000px] w-full divide-y divide-slate-200 dark:divide-slate-700 rounded-lg">
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                    <TableRow>
                      <TableHead className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Title
                      </TableHead>
                      <TableHead className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Type
                      </TableHead>
                      <TableHead className="w-[10%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Status
                      </TableHead>
                      <TableHead className="w-[10%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Priority
                      </TableHead>
                      <TableHead className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 hidden lg:table-cell">
                        Assigned To
                      </TableHead>
                      <TableHead className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Created
                      </TableHead>
                      <TableHead className="w-[5%] px-4 py-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Comments
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="px-4 py-3">
                          <Link
                            href={`/members/todos/${task.id}`}
                            className="font-medium text-coop-600 dark:text-sky-400 hover:text-coop-700 dark:hover:text-sky-500 truncate block max-w-[180px]"
                          >
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {task.todo_type === 'minuted'
                            ? 'Minuted Action'
                            : 'General'}
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
                          {task.priority && (
                            <div
                              className={`inline-flex font-medium rounded-full text-center px-2.5 py-0.5 ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority.charAt(0).toUpperCase() +
                                task.priority.slice(1)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 hidden lg:table-cell">
                          {task.assigned_to_user?.full_name ||
                            task.assigned_to_user?.email ||
                            '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {format(new Date(task.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {task.comments.length}
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedTasks.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-slate-500 dark:text-slate-400"
                        >
                          No to do items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination section */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <nav
              className="mb-4 sm:mb-0 sm:order-1"
              role="navigation"
              aria-label="Navigation"
            >
              <ul className="flex justify-center">
                <li className="ml-3 first:ml-0">
                  <Button
                    onClick={goToPreviousPage}
                    disabled={currentPage === '1'}
                    variant="outline"
                    size="sm"
                  >
                    &lt;- Previous
                  </Button>
                </li>
                <li className="ml-3 first:ml-0">
                  <Button
                    onClick={goToNextPage}
                    disabled={parseInt(currentPage) >= totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next -&gt;
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
      </div>
    </div>
  );
}
