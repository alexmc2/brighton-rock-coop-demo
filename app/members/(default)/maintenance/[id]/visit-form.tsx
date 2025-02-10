// components/visit-form.tsx

import { MaintenanceVisit } from '@/types/members/maintenance';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import { Textarea } from '@/components/members/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';
import { format } from 'date-fns';

interface VisitFormProps {
  visit: MaintenanceVisit;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function VisitForm({
  visit,
  onSubmit,
  onCancel,
  isSubmitting,
}: VisitFormProps) {
  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      {/* Date and Time Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Date</Label>
          <Input
            type="date"
            id="scheduled_date"
            name="scheduled_date"
            defaultValue={visit.scheduled_date.split('T')[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_time">Time</Label>
          <Input
            type="time"
            id="scheduled_time"
            name="scheduled_time"
            defaultValue={format(new Date(visit.scheduled_date), 'HH:mm')}
            required
          />
        </div>
      </div>

      {/* Duration Input */}
      <div className="space-y-2">
        <Label htmlFor="estimated_duration">Duration</Label>
        <Select
          name="estimated_duration"
          defaultValue={visit.estimated_duration.split(' ')[0]}
        >
          <SelectTrigger id="estimated_duration">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 hour</SelectItem>
            <SelectItem value="2">2 hours</SelectItem>
            <SelectItem value="3">3 hours</SelectItem>
            <SelectItem value="4">4 hours</SelectItem>
            <SelectItem value="8">Full day (8 hours)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes Input */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={visit.notes || ''}
          rows={2}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} variant="default">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
