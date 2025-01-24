'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MaintenanceRequestWithDetails } from '@/types/members/maintenance';
import { Button } from '@/components/members/ui/button';
import { Label } from '@/components/members/ui/label';
import { Input } from '@/components/members/ui/input';
import { Textarea } from '@/components/members/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/members/ui/tooltip';
import { Info } from 'lucide-react';
import { scheduleMaintenanceVisit } from '@/app/members/actions/maintenance/id/visit-scheduler-actions';

interface VisitSchedulerProps {
  request: MaintenanceRequestWithDetails;
}

export default function VisitScheduler({ request }: VisitSchedulerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Add user ID to form data
      formData.append('userId', user.id);

      await scheduleMaintenanceVisit(request.id, request.title, formData);
      form.reset();
      router.refresh();
    } catch (err) {
      console.error('Error scheduling visit:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="px-5 py-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Schedule Visit
        </h2>

        {error && (
          <div className="mb-4 p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">Date</Label>
            <Input
              type="date"
              id="scheduled_date"
              name="scheduled_date"
              required
            />
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Time</Label>
            <Input
              type="time"
              id="scheduled_time"
              name="scheduled_time"
              required
            />
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="estimated_duration">
              <span className="inline-flex items-center">
                Estimated Duration (hours)
                <Tooltip
                  content="Enter duration in steps of 0.5 hours (e.g., 1 = one hour, 1.5 = one and half hours)"
                  bg="dark"
                  size="md"
                  position="top"
                >
                  <Info className="h-4 w-4 text-slate-500 ml-1" />
                </Tooltip>
              </span>
            </Label>
            <Input
              type="number"
              id="estimated_duration"
              name="estimated_duration"
              min="0.5"
              step="0.5"
              required
            />
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Enter P4P job reference, etc."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} variant="default">
              {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
