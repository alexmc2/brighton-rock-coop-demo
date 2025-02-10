'use client';

import { createPatternAction } from '@/app/members/actions/treasury/pattern-server-actions';
import { Button } from '@/components/members/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/members/ui/table';
import { Badge } from '@/components/members/ui/badge';
import { toast } from 'sonner';

interface PatternSuggestion {
  description: string;
  category_id: string;
  suggested_pattern: string;
  is_expense: boolean;
  occurrence_count: number;
}

interface PatternSuggestionsProps {
  suggestions: PatternSuggestion[];
}

export function PatternSuggestions({ suggestions }: PatternSuggestionsProps) {
  const handleCreatePattern = async (suggestion: PatternSuggestion) => {
    const result = await createPatternAction({
      category_id: suggestion.category_id,
      pattern: suggestion.suggested_pattern,
      description: `Auto-generated pattern for "${suggestion.description}"`,
      is_expense: suggestion.is_expense,
    });

    if (result.success) {
      toast.success('Pattern created successfully');
    } else {
      toast.error(result.error || 'Failed to create pattern');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold py-4">Pattern Suggestions</div>
        <div className="text-sm text-muted-foreground">
          Based on your recent transactions, here are some suggested patterns
          you might want to add.
        </div>
      </div>

      <div className="relative w-full overflow-auto">
        <div className="w-full min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Suggested Pattern</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Occurrences</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((suggestion, index) => (
                <TableRow key={index}>
                  <TableCell>{suggestion.description}</TableCell>
                  <TableCell className="font-mono">
                    {suggestion.suggested_pattern}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        suggestion.is_expense ? 'destructive' : 'default'
                      }
                    >
                      {suggestion.is_expense ? 'Expense' : 'Income'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {suggestion.occurrence_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreatePattern(suggestion)}
                    >
                      Add Pattern
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {suggestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No suggestions available. Add more transactions to get
                    pattern suggestions.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
