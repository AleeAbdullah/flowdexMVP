'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/glass-panel';
import { ROUTES } from '@/routes';

export default function AdminTransactionDetailError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GlassPanel className="space-y-4 border border-rose-400/20 bg-rose-500/10 p-6">
      <div className="text-lg font-bold text-[var(--text)]">Admin payment detail unavailable</div>
      <p className="text-sm leading-7 text-rose-100">
        {props.error.message || 'This legacy detail route could not be loaded. Open the payments list and expand a row for full payment details.'}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="glass" onClick={() => props.reset()}>
          Try again
        </Button>
        <Button variant="brand" asChild>
          <Link href={ROUTES.ADMIN.TRANSACTIONS}>Open payments list</Link>
        </Button>
      </div>
    </GlassPanel>
  );
}
