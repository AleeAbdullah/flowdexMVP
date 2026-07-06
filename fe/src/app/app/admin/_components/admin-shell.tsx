import type { ReactNode } from 'react';
import { FlowdexWordmark } from '@/components/flowdex/primitives';
import { AdminNav } from './admin-nav';

export function AdminShell(props: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,color-mix(in_srgb,var(--accent-strong)_18%,transparent),transparent_24%),radial-gradient(circle_at_78%_8%,color-mix(in_srgb,var(--accent-soft)_14%,transparent),transparent_22%)]" />

      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
        <div className="section-shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <FlowdexWordmark compact />
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">
                Admin Operations
              </div>
              <div className="truncate text-sm text-[var(--muted)]">
                Payment monitoring and operational oversight
              </div>
            </div>
          </div>
          <AdminNav />
        </div>
      </header>

      <main className="section-shell section-pad space-y-8">
        {props.children}
      </main>
    </div>
  );
}
