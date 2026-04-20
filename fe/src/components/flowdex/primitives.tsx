import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FlowdexWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex items-center justify-center bg-[linear-gradient(135deg,#00B4D8,#0090B0)] text-white shadow-[0_0_32px_rgba(0,180,216,0.24)]', compact ? 'h-6 w-6 rounded-md' : 'h-8 w-8 rounded-lg')}>
        <span className={cn('font-heading font-bold leading-none', compact ? 'text-xs' : 'text-base')}>F</span>
      </div>
      {!compact ? (
        <div className="leading-none">
          <div className="font-heading text-lg font-bold tracking-tight text-[var(--text)]">FlowDex</div>
          <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--cyan)] uppercase">
            Universal Exchange
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function GlassPanel(props: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('glass-panel rounded-[1.35rem]', props.className)}>
      {props.children}
    </div>
  );
}

export function SectionHeading(props: {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn('max-w-3xl space-y-4', props.align === 'center' && 'mx-auto text-center')}>
      <div className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-1 text-[10px] font-bold tracking-[0.35em] text-[var(--cyan)] uppercase">
        {props.eyebrow}
      </div>
      <h2 className="font-heading text-balance text-3xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
        {props.title}
      </h2>
      <p className="text-balance text-sm leading-7 text-[var(--muted)] md:text-base">
        {props.description}
      </p>
    </div>
  );
}

export function DataKicker(props: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', props.className)}>
      <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className="font-data text-xl font-semibold text-[var(--text)] md:text-2xl">{props.value}</div>
    </div>
  );
}

const statusToneMap: Record<string, string> = {
  PENDING: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
  MATCHED: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  CONFIRMING: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  CONFIRMED: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  EXPIRED: 'border-slate-400/20 bg-slate-400/10 text-slate-200',
  FAILED: 'border-rose-400/20 bg-rose-500/10 text-rose-100',
  REFUNDED: 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100',
  APPROVED: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
  SENT: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
};

export function StatusPill(props: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.24em] uppercase',
        statusToneMap[props.status] ?? 'border-white/10 bg-white/5 text-slate-200',
        props.className,
      )}
    >
      {props.status}
    </span>
  );
}
