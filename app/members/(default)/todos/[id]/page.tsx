// app/(default)/todos/[id]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TodoWithDetails, TodoComment } from '@/types/members/todos';
import CommentSection from '@/components/members/comments-section';
import TodoHeader from './todo-header';
import TodoDetails from './todo-details';
import { getTodo } from '@/app/members/actions/todos/id/todo-actions';

export const metadata: Metadata = {
  title: 'To do Details - Co-op Management',
  description: 'View and manage to do item details',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TodoDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const result = await getTodo(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const todo = result.data;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <TodoHeader todo={todo} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        <div className="xl:col-span-2 space-y-6">
          <TodoDetails todo={todo} />
          <CommentSection<TodoComment>
            comments={todo.comments}
            resourceId={todo.id}
            resourceType={{
              type: 'todo',
              field: 'todo_id',
              contentField: 'content',
              userField: 'created_by',
            }}
          />
        </div>
      </div>
    </div>
  );
}
