import * as React from 'react';
import { cn } from '@/lib/members/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          [
            'flex min-h-[80px] w-full',
            'rounded-md border border-slate-300',
            'bg-white px-3 py-2 text-sm',
            'text-slate-700',
            'placeholder:text-slate-400',
            'focus-visible:outline-none',
            'focus-visible:border-none',
            'focus-visible:ring-2',
            'focus-visible:ring-coop-400/50',
            // Dark mode styles
            'dark:border-slate-600',
            'dark:bg-slate-700',
            'dark:text-slate-100',
            'dark:focus-visible:outline-none',
            'dark:focus-visible:border-none',
            'dark:focus-visible:ring-2',
            'dark:focus-visible:ring-sky-500',
          ].join(' '),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
