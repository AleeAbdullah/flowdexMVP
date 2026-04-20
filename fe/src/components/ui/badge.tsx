import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.24em] uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]',
        brand: 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--cyan)]',
        success: 'border-[color-mix(in_srgb,var(--green)_35%,transparent)] bg-[color-mix(in_srgb,var(--green)_12%,transparent)] text-[var(--green)]',
        subtle: 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--muted)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
