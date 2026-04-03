import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FlowdexWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/35 bg-cyan-400/12 shadow-[0_0_32px_rgba(0,180,216,0.28)]">
        <div className="h-4 w-4 rotate-45 rounded-[6px] border border-cyan-300/70 bg-gradient-to-br from-cyan-300 to-sky-600" />
      </div>
      {!compact ? (
        <div className="leading-none">
          <div className="text-lg font-extrabold tracking-[0.24em] text-white uppercase">FlowDex</div>
          <div className="text-[10px] font-semibold tracking-[0.36em] text-cyan-300/80 uppercase">
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
      <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-1 text-[10px] font-bold tracking-[0.35em] text-cyan-300 uppercase">
        {props.eyebrow}
      </div>
      <h2 className="text-balance text-3xl font-black tracking-tight text-white md:text-5xl">
        {props.title}
      </h2>
      <p className="text-balance text-sm leading-7 text-slate-300 md:text-base">
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
      <div className="text-[10px] font-semibold tracking-[0.32em] text-slate-400 uppercase">
        {props.label}
      </div>
      <div className="font-data text-xl font-semibold text-white md:text-2xl">{props.value}</div>
    </div>
  );
}
