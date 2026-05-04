import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/flowdex/primitives';
import { ROUTES } from '@/routes';

export default function TransactionNotFound() {
  return (
    <GlassPanel className="space-y-4 border border-[var(--card-border)] p-6">
      <div className="text-lg font-bold text-[var(--text)]">Transaction not found</div>
      <p className="text-sm leading-7 text-[var(--muted)]">
        The requested transaction does not exist or is no longer available.
      </p>
      <Button variant="glass" asChild>
        <Link href={ROUTES.WORKSPACE.TRANSACTIONS}>Back to transactions</Link>
      </Button>
    </GlassPanel>
  );
}
