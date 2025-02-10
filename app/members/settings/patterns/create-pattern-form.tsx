'use client';

import { useState } from 'react';
import {
  createPatternAction,
  CategoryPattern,
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
import { toast } from 'sonner';

interface CreatePatternFormProps {
  onSuccess: (pattern: CategoryPattern) => void;
}

export function CreatePatternForm({ onSuccess }: CreatePatternFormProps) {
  const [pattern, setPattern] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isExpense, setIsExpense] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate the pattern is a valid regex
      new RegExp(pattern, 'i');

      const result = await createPatternAction({
        pattern,
        description,
        category_id: categoryId,
        is_expense: isExpense,
      });

      if (result.success && result.data) {
        onSuccess(result.data);
        toast.success('Pattern created successfully');
        // Reset form
        setPattern('');
        setDescription('');
        setCategoryId('');
        setIsExpense(false);
      } else {
        toast.error(result.error || 'Failed to create pattern');
      }
    } catch (err) {
      toast.error('Invalid regular expression pattern');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pattern">Pattern (Regular Expression)</Label>
        <Input
          id="pattern"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="e.g. ^RENT FROM.*$"
          required
        />
        <p className="text-sm text-muted-foreground">
          Use regular expressions to match transaction descriptions. Common
          patterns:
          <br />
          • ^TEXT$ - Exact match
          <br />
          • ^TEXT.* - Starts with TEXT
          <br />
          • .*TEXT$ - Ends with TEXT
          <br />• .*TEXT.* - Contains TEXT
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Match rent payments from tenants"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {/* Categories will be populated here */}
            <SelectItem value="category1">Category 1</SelectItem>
            <SelectItem value="category2">Category 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="isExpense">Expense</Label>
          <p className="text-sm text-muted-foreground">
            Is this pattern for expense transactions?
          </p>
        </div>
        <Switch
          id="isExpense"
          checked={isExpense}
          onCheckedChange={setIsExpense}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creating...' : 'Create Pattern'}
      </Button>
    </form>
  );
}
