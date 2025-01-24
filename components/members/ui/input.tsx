import * as React from 'react';

import { cn } from '@/lib/members/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          [
            'flex h-10 w-full',
            'rounded-md border border-slate-200',
            'bg-white px-3 py-2 text-sm',
            'ring-offset-white',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-slate-500',
            'focus-visible:outline-none',
            'focus-visible:border-none',
            'focus-visible:ring-2',
            'focus-visible:ring-coop-400/50',

            'disabled:cursor-not-allowed disabled:opacity-50',
            // Dark mode styles
            'dark:border-slate-800',
            'dark:bg-slate-700',
            'dark:text-slate-300',
            'dark:placeholder:text-slate-400',
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
Input.displayName = 'Input';

export { Input };
