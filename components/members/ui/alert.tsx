import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/members/utils';

const alertVariants = cva(
  [
    'relative w-full rounded-lg border p-4',
    '[&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px]',
    '[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: [
          'border-destructive/50 text-destructive dark:border-destructive',
          '[&>svg]:text-destructive',
        ].join(' '),
        warning: [
          'border-orange-700/80 text-orange-700 dark:text-yellow-500',
          '[&>svg]:text-orange-700 dark:[&>svg]:text-yellow-500',
          'dark:border-yellow-500/50',
        ].join(' '),
        success: [
          'border-green-500/50 text-green-600 dark:text-green-500',
          '[&>svg]:text-green-600',
          'dark:border-green-500/50',
        ].join(' '),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & {
      icon?: React.ComponentType<{ className?: string }>;
    }
>(({ className, variant, icon: Icon, children, ...props }, ref) => {
  const IconComponent =
    Icon ||
    {
      default: Info,
      destructive: AlertCircle,
      warning: AlertTriangle,
      success: CheckCircle,
    }[variant || 'default'];

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <IconComponent className="h-4 w-4" />
      {children}
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      ['mb-1 font-medium', 'leading-none tracking-tight'].join(' '),
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(['text-sm', '[&_p]:leading-relaxed'].join(' '), className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
