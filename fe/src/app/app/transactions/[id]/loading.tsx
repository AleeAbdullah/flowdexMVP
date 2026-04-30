import { GlassPanel } from '@/components/flowdex/primitives';

export default function TransactionDetailLoading() {
  return (
    <GlassPanel className="p-6 text-sm text-[var(--muted)]">
      Loading transaction detail…
    </GlassPanel>
  );
}
