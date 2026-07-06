import { Loader2 } from '@/icons';
import { GlassPanel } from '@/components/glass-panel';

export default function AdminLoading() {
  return (
    <GlassPanel className="flex items-center gap-3 p-6 text-sm text-[var(--muted)]">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" />
      Loading admin workspace…
    </GlassPanel>
  );
}
