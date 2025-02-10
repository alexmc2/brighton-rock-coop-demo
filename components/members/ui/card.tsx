import * as React from 'react';

import { cn } from '@/lib/members/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      [
        'rounded-lg border',
        'border-coop-200/20',
        'bg-white text-slate-700',
        'shadow-sm',

        // Dark mode
        'dark:border-sky-500/20',
        'dark:bg-slate-800',
        'dark:text-slate-300',
      ].join(' '),
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardTreasury = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      [
        'rounded-bl-lg rounded-br-lg',
        'pt-4',
        'border',
        'border-3',
        'border-t-0',
        'bg-white text-slate-700',
        'shadow-sm',
        'border-coop-200/80',
        'dark:border-sky-500/50',
        // Dark mode

        'dark:bg-slate-800',
        'dark:text-slate-300',
      ].join(' '),
      className
    )}
    {...props}
  />
));
CardTreasury.displayName = 'CardTreasury';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(['flex flex-col', 'space-y-1.5', 'p-6'].join(' '), className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      ['text-2xl font-semibold', 'leading-none tracking-tight'].join(' '),
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      [
        'text-sm',
        'text-slate-500',
        // Dark mode
        'dark:text-slate-400',
      ].join(' '),
      className
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(['p-6 pt-0 dark:border-slate-700  '].join(' '), className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(['flex items-center', 'p-6 pt-0'].join(' '), className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardTreasury,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
