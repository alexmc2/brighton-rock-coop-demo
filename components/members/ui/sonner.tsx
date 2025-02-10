'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="system"
      className="text-lg"
      toastOptions={{
        classNames: {
          toast:
            'group dark:bg-black dark:text-gray-100 dark:border-gray-700 text-lg',
          description: 'text-base opacity-90',
          actionButton: 'dark:bg-black dark:hover:bg-gray-600 text-base',
          cancelButton: 'dark:bg-black dark:hover:bg-gray-700 text-base',
        },
      }}
    />
  );
}

// Updated toastWithMonth with proper month formatting
export function toastWithMonth(month: Date) {
  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(month);

  return {
    success: (message: string, count: number) =>
      toast.success(`${message}`, {
        description: `Successfully imported ${count} transactions to ${monthName}`,
        classNames: {
          toast: 'text-xl',
          description: 'text-base',
        },
        action: {
          label: 'View',
          onClick: () => {
            /* Add navigation logic */
          },
        },
      }),
    error: (message: string, errorDetails: string) =>
      toast.error(message, {
        description: `Error in ${monthName}: ${errorDetails}`,
        classNames: {
          toast: 'dark:bg-red-950 dark:border-red-900 text-xl',
          description: 'dark:text-red-200 text-base',
        },
        action: {
          label: 'Retry',
          onClick: () => {
            /* Add retry logic */
          },
        },
      }),
  };
}

export { toast };
