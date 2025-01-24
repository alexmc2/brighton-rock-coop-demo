// app/(default)/todos/page.tsx

import { Metadata } from 'next';
import TodoList from './todo-list';
import TodoHeader from './todo-header';
import { getTodos } from '@/app/members/actions/todos/page-actions';

export const metadata: Metadata = {
  title: 'To do - Co-op Management',
  description: 'View and manage co-op to do items',
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TodosPage() {
  const todos = await getTodos();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <TodoHeader />
      <TodoList tasks={todos} />
    </div>
  );
}
