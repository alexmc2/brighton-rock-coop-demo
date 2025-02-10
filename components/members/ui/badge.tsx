import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/members/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground hover:bg-primary/80',
          'dark:bg-primary-dark dark:text-primary-foreground-dark dark:hover:bg-primary-dark/80',
        ].join(' '),
        orange: [
          'bg-orange-500 text-white hover:bg-orange-600',
          'dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700/90',
        ].join(' '),
        destructive: [
          'bg-red-700 text-white hover:bg-red-800',
          'dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90',
        ].join(' '),
        outline: [
          'border border-slate-200 text-foreground',
          'dark:border-slate-700 dark:text-foreground-dark',
        ].join(' '),
        secondary: [
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          'dark:bg-secondary-dark dark:text-secondary-foreground-dark dark:hover:bg-secondary-dark/80',
        ].join(' '),
        ghost: [
          'hover:bg-slate-100 hover:text-slate-900',
          'dark:hover:bg-slate-800 dark:hover:text-slate-50',
        ].join(' '),
        link: [
          'text-slate-900 underline-offset-4 hover:underline',
          'dark:text-slate-50',
        ].join(' '),
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 px-3 py-1',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
