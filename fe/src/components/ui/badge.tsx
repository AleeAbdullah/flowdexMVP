import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.24em] uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)] text-[var(--flowdex-text)]',
        brand: 'border-[var(--flowdex-accent-border)] bg-[var(--flowdex-accent-bg)] text-[var(--flowdex-cyan)]',
        success: 'border-[color-mix(in_srgb,var(--flowdex-green)_35%,transparent)] bg-[color-mix(in_srgb,var(--flowdex-green)_12%,transparent)] text-[var(--flowdex-green)]',
        subtle: 'border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)] text-[var(--flowdex-muted)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
