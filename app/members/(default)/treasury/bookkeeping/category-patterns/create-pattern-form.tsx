'use client';

import { useState, useEffect } from 'react';
import {
  createPatternAction,
  CategoryPattern,
  getCategoriesAction,
} from '@/app/members/actions/treasury/pattern-server-actions';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import { Switch } from '@/components/members/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/members/ui/dialog';
import { toast } from 'sonner';

interface CreatePatternFormProps {
  onSuccess: (pattern: CategoryPattern) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePatternForm({
  onSuccess,
  open,
  onOpenChange,
}: CreatePatternFormProps) {
  const [pattern, setPattern] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isExpense, setIsExpense] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; is_expense: boolean }>
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const result = await getCategoriesAction();
      if (result.success && result.data) {
        setCategories(result.data);
      }
      setIsLoadingCategories(false);
    }
    loadCategories();
  }, []);

  // Filter categories based on isExpense state
  const filteredCategories = categories.filter(
    (cat) => cat.is_expense === isExpense && cat.name !== 'Bank Account'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('[CreatePatternForm] Starting form submission');

    try {
      // Validate the pattern is a valid regex
      console.log('[CreatePatternForm] Validating regex pattern:', pattern);
      new RegExp(pattern, 'i');

      console.log('[CreatePatternForm] Submitting pattern:', {
        pattern,
        description,
        category_id: categoryId,
        is_expense: isExpense,
      });

      const result = await createPatternAction({
        pattern,
        description,
        category_id: categoryId,
        is_expense: isExpense,
      });

      console.log('[CreatePatternForm] Submission result:', result);

      if (result.success && result.data) {
        onSuccess(result.data);
        toast.success('Pattern created successfully');
        // Reset form
        setPattern('');
        setDescription('');
        setCategoryId('');
        setIsExpense(false);
        // Close dialog
        onOpenChange(false);
      } else {
        console.error(
          '[CreatePatternForm] Failed to create pattern:',
          result.error
        );
        toast.error(result.error || 'Failed to create pattern');
      }
    } catch (err) {
      console.error('[CreatePatternForm] Invalid regex pattern:', err);
      toast.error('Invalid regular expression pattern');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="space-y-2">
          <DialogTitle>Create New Pattern</DialogTitle>
          <DialogDescription className="dark:text-muted-foreground">
            Add a new pattern to automatically categorise transactions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pattern">Pattern (Regular Expression)</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. ^RENT FROM.*$"
                required
              />
              <div className="text-muted-foreground space-y-2 pt-4">
                <p>Common patterns:</p>
                <ul className="list-none pl-3 space-y-1">
                  <li>• ^TEXT$ - Exact match</li>
                  <li>• ^TEXT.* - Starts with TEXT</li>
                  <li>• .*TEXT$ - Ends with TEXT</li>
                  <li>• .*TEXT.* - Contains TEXT</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isExpense">Expense</Label>
                <p className="text-muted-foreground">
                  Is this pattern for expense transactions?
                </p>
              </div>
              <Switch
                id="isExpense"
                checked={isExpense}
                onCheckedChange={(checked) => {
                  setIsExpense(checked);
                  // Reset category selection when switching expense type
                  setCategoryId('');
                }}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground dark:data-[state=checked]:bg-sky-500 dark:data-[state=unchecked]:bg-muted-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={isLoadingCategories}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCategories
                        ? 'Loading categories...'
                        : 'Select a category'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Match rent payments from tenants"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingCategories}
            >
              {isSubmitting ? 'Creating...' : 'Create Pattern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
