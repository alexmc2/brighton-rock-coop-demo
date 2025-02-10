// app/(default)/tasks/[id]/task-details.tsx

import { format } from 'date-fns';
import {
  TodoWithDetails,
  TodoStatus,
  TodoPriority,
} from '@/types/members/todos';
import TodoActions from './todo-actions';

interface TodoDetailsProps {
  todo: TodoWithDetails;
}

export default function TodoDetails({ todo }: TodoDetailsProps) {
  const getStatusBadgeStyle = (status: TodoStatus) => {
    const styles = {
      pending:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
      in_progress:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
      completed:
        'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
      todo: 'bg-slate-400/20 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400',
    } as const;
    return styles[status] || styles.pending;
  };

  const getPriorityBadgeStyle = (priority: TodoPriority) => {
    const styles = {
      low: 'bg-slate-400/20 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400',
      medium:
        'bg-blue-500/20 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      high: 'bg-orange-500/20 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
      urgent: 'bg-red-500/20 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    } as const;
    return styles[priority] || styles.medium;
  };

  const formatStatus = (status: TodoStatus) => {
    const formats = {
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      pending: 'Pending',
      todo: 'To Do',
    } as const;
    return formats[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 py-2">
      <div className="flex flex-col gap-4"></div>
      <div className="px-5 py-4">
        <div className="space-y-4">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap gap-2">
            <div
              className={`text-xs inline-flex font-medium ${getStatusBadgeStyle(
                todo.status
              )} rounded-full text-center px-2.5 py-1`}
            >
              {formatStatus(todo.status)}
            </div>
            {todo.priority && (
              <div
                className={`text-xs inline-flex font-medium ${getPriorityBadgeStyle(
                  todo.priority
                )} rounded-full text-center px-2.5 py-1`}
              >
                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
              </div>
            )}
          </div>

          <div className="text-xl md:text-xl text-slate-800 dark:text-slate-100 font-bold ">
            {todo.title}
          </div>
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
              Description
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
              {todo.description || '-'}
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
              Assigned To
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {todo.assigned_to_user?.full_name ||
                todo.assigned_to_user?.email ||
                '-'}
            </div>
          </div>

          {/* Due Date */}
          {todo.due_date && (
            <div>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
                Due Date
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {format(new Date(todo.due_date), 'MMM d, yyyy')}
              </div>
            </div>
          )}

          {/* Created At */}
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
              Created
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {format(new Date(todo.created_at), 'MMM d, yyyy h:mm a')}
              {todo.created_by_user && (
                <span className="ml-1">
                  by{' '}
                  {todo.created_by_user.full_name || todo.created_by_user.email}
                </span>
              )}
            </div>
          </div>

          {/* Last Updated */}
          <div>
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
              Last Updated
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {format(new Date(todo.updated_at), 'MMM d, yyyy h:mm a')}
              {todo.last_modified_by_user && (
                <span className="ml-1">
                  by{' '}
                  {todo.last_modified_by_user.full_name ||
                    todo.last_modified_by_user.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
