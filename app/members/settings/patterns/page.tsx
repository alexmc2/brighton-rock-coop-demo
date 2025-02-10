import { Suspense } from 'react';
import { getPatternsAction } from '@/app/members/actions/treasury/pattern-server-actions';
import { PatternList } from './pattern-list';
import { PatternSuggestions } from './pattern-suggestions';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/members/ui/tabs';

export const metadata = {
  title: 'Transaction Patterns | Settings',
};

export default async function PatternsPage() {
  const { data: patterns } = await getPatternsAction();

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction Patterns
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage how transactions are automatically categorized based on their
            descriptions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="patterns" className="mt-6">
        <TabsList>
          <TabsTrigger value="patterns">Active Patterns</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="mt-4">
          <Suspense fallback={<div>Loading patterns...</div>}>
            <PatternList initialPatterns={patterns || []} />
          </Suspense>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Suspense fallback={<div>Loading suggestions...</div>}>
            <PatternSuggestions suggestions={[]} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
