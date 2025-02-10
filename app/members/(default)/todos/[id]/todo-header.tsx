// app/(default)/tasks/[id]/task-header.tsx

'use client';

import Link from 'next/link';
import { TodoWithDetails } from '@/types/members/todos';
import TodoActions from './todo-actions';

interface TodoHeaderProps {
  todo: TodoWithDetails;
}

export default function TodoHeader({ todo }: TodoHeaderProps) {
  return (
    <div className="mb-4">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/members/todos"
          className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {'<-'} Back to To do
        </Link>
      </div>

      <div className="flex flex-col gap-4">
     
          <TodoActions todo={todo} />
        </div>
      </div>

  );
}
