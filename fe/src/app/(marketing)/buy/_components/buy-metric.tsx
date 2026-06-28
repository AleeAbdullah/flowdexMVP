import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function BuyMetric(props: {
  label: string;
  value: string;
  note?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_42%,transparent)] uppercase">
        {props.label}
      </div>
      <div className={cn('mt-2 font-data text-lg font-bold', props.accent ? 'text-[var(--cyan)]' : 'text-[var(--text)]')}>
        {props.value}
        {props.note ? <span className="ml-1 text-xs font-medium text-[var(--muted)]">{props.note}</span> : null}
      </div>
    </div>
  );
}
