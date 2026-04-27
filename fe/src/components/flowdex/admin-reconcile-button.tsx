'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useReconcileAdminTransaction } from '@/dal/app/hooks';

export function AdminReconcileButton(props: {
  transactionId: string;
}) {
  const router = useRouter();
  const reconcileMutation = useReconcileAdminTransaction();

  return (
    <Button
      variant="glass"
      disabled={reconcileMutation.isPending}
      onClick={async () => {
        try {
          const updated = await reconcileMutation.mutateAsync(props.transactionId);
          toast.success(`Reconciliation complete: ${updated.status}`);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to reconcile transaction');
        }
      }}
    >
      {reconcileMutation.isPending ? 'Reconciling...' : 'Reconcile now'}
    </Button>
  );
}
