'use client';

import * as React from 'react';
import { lazy, Suspense, useState } from 'react';
import { cn } from '@/lib/utils';

const Dithering = lazy(() =>
  import('@paper-design/shaders-react').then(mod => ({ default: mod.Dithering })),
);

export type HeroDitheringCardProps = React.HTMLAttributes<HTMLDivElement> & {
  contentClassName?: string;
  colorFront?: string;
};

export function HeroDitheringCard({
  children,
  className,
  contentClassName,
  colorFront = '#00B4D8',
  ...props
}: HeroDitheringCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-[var(--flowdex-card-border)] bg-[var(--flowdex-card-bg)] text-[var(--flowdex-text)] shadow-[0_12px_50px_rgba(2,8,23,0.20)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-[var(--flowdex-cyan)]',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <Suspense fallback={<div className="absolute inset-0 bg-[var(--flowdex-accent-bg)]" />}>
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[var(--flowdex-dither-opacity)] [mix-blend-mode:var(--flowdex-dither-blend)]">
          <Dithering
            colorBack="#00000000"
            colorFront={colorFront}
            shape="warp"
            type="4x4"
            speed={isHovered ? 0.6 : 0.2}
            className="size-full"
            minPixelRatio={1}
          />
        </div>
      </Suspense>
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_16%,color-mix(in_srgb,var(--flowdex-cyan)_12%,transparent),transparent_34%),var(--flowdex-dither-overlay)]" />
      <div className={cn('relative z-10', contentClassName)}>{children}</div>
    </div>
  );
}
