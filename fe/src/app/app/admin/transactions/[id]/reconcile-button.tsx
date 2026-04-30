'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useReconcileAdminTransaction } from '@/dal/app/admin/admin.services';

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
          await reconcileMutation.mutateAsync(props.transactionId);
          router.refresh();
        } catch {
          // Mutation hook owns error feedback.
        }
      }}
    >
      {reconcileMutation.isPending ? 'Reconciling…' : 'Reconcile now'}
    </Button>
  );
}
