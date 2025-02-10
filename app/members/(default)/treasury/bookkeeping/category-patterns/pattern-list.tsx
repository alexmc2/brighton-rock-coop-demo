'use client';

import { useState } from 'react';
import {
  CategoryPattern,
  updatePatternAction,
  deletePatternAction,
} from '@/app/members/actions/treasury/pattern-server-actions';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/members/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/members/ui/dialog';
import { Badge } from '@/components/members/ui/badge';
import { toast } from 'sonner';
import { CreatePatternForm } from './create-pattern-form';

interface PatternListProps {
  initialPatterns: CategoryPattern[];
}

export function PatternList({ initialPatterns }: PatternListProps) {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [editingPattern, setEditingPattern] = useState<CategoryPattern | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleUpdatePattern = async (
    pattern: CategoryPattern,
    updates: Partial<CategoryPattern>
  ) => {
    const result = await updatePatternAction(pattern.id, updates);
    if (result.success) {
      setPatterns(
        patterns.map((p) => (p.id === pattern.id ? { ...p, ...updates } : p))
      );
      toast.success('Pattern updated successfully');
    } else {
      toast.error(result.error || 'Failed to update pattern');
    }
  };

  const handleDeletePattern = async (pattern: CategoryPattern) => {
    const result = await deletePatternAction(pattern.id);
    if (result.success) {
      setPatterns(patterns.filter((p) => p.id !== pattern.id));
      toast.success('Pattern deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete pattern');
    }
  };

  const handlePatternCreated = (newPattern: CategoryPattern) => {
    setPatterns([newPattern, ...patterns]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="text-lg font-semibold py-4">Active Patterns</div>
          <div className="text-sm text-muted-foreground">
            These patterns are used to automatically categorise your
            transactions.
          </div>
        </div>

        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          Add Pattern
        </Button>
      </div>

      <CreatePatternForm
        onSuccess={handlePatternCreated}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <div className="relative w-full overflow-auto">
        <div className="w-full min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pattern</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Matches</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns.map((pattern) => (
                <TableRow key={pattern.id}>
                  <TableCell className="font-mono">{pattern.pattern}</TableCell>
                  <TableCell>{pattern.category?.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={pattern.is_expense ? 'destructive' : 'default'}
                      size="xs"
                    >
                      {pattern.is_expense ? 'Expense' : 'Income'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {pattern.match_count}
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${pattern.confidence_score * 100}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={isEditDialogOpen}
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Pattern</DialogTitle>
                          <DialogDescription>
                            Update this pattern's matching rules.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Pattern</Label>
                            <Input
                              defaultValue={pattern.pattern}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                try {
                                  new RegExp(e.target.value, 'i');
                                  handleUpdatePattern(pattern, {
                                    pattern: e.target.value,
                                  });
                                } catch (err) {
                                  // Invalid regex, don't update
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              defaultValue={pattern.description}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                handleUpdatePattern(pattern, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeletePattern(pattern)}
                          >
                            Delete Pattern
                          </Button>
                          <Button
                            variant="default"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Save & Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {patterns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No patterns found. Add one to start automatically
                    categorising transactions.
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
