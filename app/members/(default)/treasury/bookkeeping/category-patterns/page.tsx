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
import {
  CardTreasury,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/members/ui/card';

export const metadata = {
  title: 'Transaction Patterns | Settings',
};

export default async function PatternsPage() {
  const { data: patterns } = await getPatternsAction();

  return (
    <CardTreasury className="space-y-2">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Transaction Patterns
        </CardTitle>
        <CardDescription className="py-2">
          Manage how transactions are automatically categorised based on their
          descriptions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patterns">
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
      </CardContent>
    </CardTreasury>
  );
}
