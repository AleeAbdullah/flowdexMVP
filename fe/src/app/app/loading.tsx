import { GlassPanel } from '@/components/glass-panel';

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <GlassPanel className="p-6 text-sm text-[var(--muted)]">
        Loading protected app workspace…
      </GlassPanel>
    </div>
  );
}
