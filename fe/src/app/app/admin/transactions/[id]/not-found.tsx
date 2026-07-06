import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/glass-panel';
import { ROUTES } from '@/routes';

export default function AdminTransactionNotFound() {
  return (
    <GlassPanel className="space-y-4 border border-[var(--card-border)] p-6">
      <div className="text-lg font-bold text-[var(--text)]">Admin payment not found</div>
      <p className="text-sm leading-7 text-[var(--muted)]">
        This legacy detail route no longer serves individual payments. Open the payments list and expand a row to inspect full payment details.
      </p>
      <Button variant="brand" asChild>
        <Link href={ROUTES.ADMIN.TRANSACTIONS}>Back to admin payments</Link>
      </Button>
    </GlassPanel>
  );
}
