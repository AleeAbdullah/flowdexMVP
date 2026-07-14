import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-2xl border px-5 py-4 text-[var(--text)] shadow-[0_12px_36px_rgba(2,8,23,0.18)] transition-colors [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-1px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-4 [&>svg]:h-4.5 [&>svg]:w-4.5',
  {
    variants: {
      variant: {
        default:
          'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)] [&>svg]:text-[var(--muted)]',
        brand:
          'border-[var(--accent-border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-bg)_92%,transparent),color-mix(in_srgb,var(--card-bg)_88%,transparent))] text-[color-mix(in_srgb,var(--text)_94%,transparent)] [&>svg]:text-[var(--cyan)]',
        destructive:
          'border-[var(--status-error-border)] bg-[var(--status-error-surface)] text-[var(--status-error-text)] [&>svg]:text-[var(--status-error-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 text-[11px] font-bold tracking-[0.26em] uppercase', className)}
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
    className={cn('text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)] [&_p]:leading-7', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
