import type { ReactNode } from 'react';
import { GlassPanel } from '@/components/glass-panel';
import { FlowdexWordmark } from '../primitives';

export function AuthFormShell(props: {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="section-shell section-pad flex min-h-screen items-center justify-center">
      <GlassPanel className="w-full max-w-xl p-8 md:p-10">
        <div className="space-y-6">
          <FlowdexWordmark />

          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-1 text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
              {props.badge}
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text)]">
              {props.title}
            </h1>
            <p className="text-sm leading-7 text-[var(--muted)]">
              {props.description}
            </p>
          </div>

          {props.children}
        </div>
      </GlassPanel>
    </div>
  );
}
