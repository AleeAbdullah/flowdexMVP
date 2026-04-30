'use client';

import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/flowdex/primitives';

export default function AppError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <GlassPanel className="space-y-4 border border-rose-400/20 bg-rose-500/10 p-6">
      <div className="text-lg font-bold text-[var(--text)]">Protected app unavailable</div>
      <p className="text-sm leading-7 text-rose-100">
        {props.error.message || 'Something went wrong while loading the protected app.'}
      </p>
      <Button variant="glass" onClick={() => props.reset()}>
        Try again
      </Button>
    </GlassPanel>
  );
}
