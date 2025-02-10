// app/(default)/doodle-polls/create-event-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DoodlePoll,
  DoodlePollOption,
  DoodlePollParticipant,
} from '@/types/members/doodle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/members/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/members/ui/alert-dialog';
import { Button } from '@/components/members/ui/button';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/members/ui/radio-group';
import { Label } from '@/components/members/ui/label';
import { CalendarClock, CheckCircle2, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { createEventFromPoll } from '@/app/members/actions/doodle-polls/create-event-actions';

interface CreateEventButtonProps {
  poll: DoodlePoll;
  options: DoodlePollOption[];
  participants: DoodlePollParticipant[];
  onEventCreated?: () => void;
}

interface OptionScore {
  option: DoodlePollOption;
  score: number;
  yesCount: number;
  maybeCount: number;
  noCount: number;
}

export default function CreateEventButton({
  poll,
  options,
  participants,
  onEventCreated,
}: CreateEventButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const getOptionScore = (optionId: string): OptionScore => {
    let yesCount = 0;
    let maybeCount = 0;
    let noCount = 0;

    participants.forEach((participant) => {
      const response = participant.responses[optionId];
      if (response === 'yes') yesCount++;
      else if (response === 'maybe') maybeCount++;
      else if (response === 'no') noCount++;
    });

    const option = options.find((o) => o.id === optionId)!;
    return {
      option,
      score: yesCount * 2 + maybeCount,
      yesCount,
      maybeCount,
      noCount,
    };
  };

  const getBestOption = (): OptionScore => {
    return options
      .map((option) => getOptionScore(option.id))
      .reduce((best, current) => (current.score > best.score ? current : best));
  };

  const formatOptionLabel = (score: OptionScore) => {
    const date = format(new Date(score.option.date), 'EEE, MMM d');
    const time = score.option.start_time
      ? format(new Date(`2000-01-01T${score.option.start_time}`), 'h:mm a')
      : '';
    const duration = score.option.duration
      ? `(${score.option.duration} hours)`
      : '';

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col">
          <span>{`${date} at ${time} ${duration}`}</span>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
              {score.yesCount}
            </div>
            <div className="flex items-center">
              <Minus className="w-4 h-4 text-yellow-500 mr-1" />
              {score.maybeCount}
            </div>
          </div>
        </div>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {score.score} points
        </div>
      </div>
    );
  };

  const handleCreateEvent = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const selectedTimeSlot = options.find((o) => o.id === selectedOption);
      if (!selectedTimeSlot) throw new Error('No time slot selected');

      const { success, error: createError } = await createEventFromPoll({
        poll,
        selectedTimeSlot,
        participants,
      });

      if (!success) throw new Error(createError || 'Failed to create event');

      setIsOpen(false);
      setIsAlertOpen(false);
      onEventCreated?.();
      router.refresh();
      alert('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating the event'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get best option and scores for all options
  const bestOption = getBestOption();
  const optionScores = options
    .map((option) => getOptionScore(option.id))
    .sort((a, b) => b.score - a.score);

  // Auto-select the best option initially
  if (bestOption && !selectedOption) {
    setSelectedOption(bestOption.option.id);
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="w-full sm:w-auto">
            <CalendarClock className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 ">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Create Event from Poll
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Choose when to schedule the event
              </p>

              <RadioGroup
                value={selectedOption}
                onValueChange={setSelectedOption}
                className="space-y-3"
              >
                {optionScores.map((score) => (
                  <div
                    key={score.option.id}
                    className={cn(
                      'flex items-center space-x-3 p-4 rounded-lg border transition-colors duration-200',
                      score.option.id === selectedOption
                        ? 'border-green-200 dark:border-sky-800 bg-green-100 dark:bg-sky-900/80'
                        : score.option.id === bestOption.option.id &&
                          score.option.id !== selectedOption
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 /40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 /40'
                    )}
                  >
                    <RadioGroupItem
                      value={score.option.id}
                      id={score.option.id}
                      className="border-slate-300 dark:border-slate-600 text-green-600 dark:text-sky-600"
                    />
                    <Label
                      htmlFor={score.option.id}
                      className="flex-1 cursor-pointer text-slate-900 dark:text-slate-100"
                    >
                      {formatOptionLabel(score)}
                    </Label>
                    {score.option.id === bestOption.option.id && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-sky-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={!selectedOption || isSubmitting}
                onClick={() => setIsAlertOpen(true)}
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 ">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
              Create Event
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              This will close the poll and add the event to the calendar. Do you
              wish to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateEvent}
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-sky-600 dark:hover:bg-sky-700"
            >
              {isSubmitting ? 'Creating...' : 'Yes, create event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
