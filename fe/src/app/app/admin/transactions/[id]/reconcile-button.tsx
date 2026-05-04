'use client';

import { useRouter } from 'next/navigation';
import { useReconcileAdminTransaction } from '@/dal/app/admin/admin.services';
import { ConfirmationDialog } from '@/components/flowdex/confirmation-dialog';

export function AdminReconcileButton(props: {
  status: string;
  transactionId: string;
}) {
  const router = useRouter();
  const reconcileMutation = useReconcileAdminTransaction();

  return (
    <ConfirmationDialog
      title="Reconcile Transaction"
      description={`Reconcile transaction ${props.transactionId} with current status ${props.status}. This refreshes the transaction status and confirmation details.`}
      triggerLabel="Reconcile now"
      confirmLabel="Reconcile Transaction"
      pendingLabel="Reconciling..."
      disabled={reconcileMutation.isPending}
      isPending={reconcileMutation.isPending}
      onConfirm={async () => {
        try {
          await reconcileMutation.mutateAsync(props.transactionId);
          router.refresh();
        } catch {
          // Mutation hook owns error feedback.
        }
      }}
    />
  );
}
