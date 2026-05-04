import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/flowdex/primitives';
import { ROUTES } from '@/routes';

export default function AdminTransactionNotFound() {
  return (
    <GlassPanel className="space-y-4 border border-[var(--card-border)] p-6">
      <div className="text-lg font-bold text-[var(--text)]">Admin transaction not found</div>
      <p className="text-sm leading-7 text-[var(--muted)]">
        The requested admin transaction does not exist or is no longer available.
      </p>
      <Button variant="glass" asChild>
        <Link href={ROUTES.ADMIN.TRANSACTIONS}>Back to admin transactions</Link>
      </Button>
    </GlassPanel>
  );
}
