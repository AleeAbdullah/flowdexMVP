'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSimulateTransaction, useTrackTransaction, useWallets } from '@/dal/app/hooks';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from './primitives';

export function ProtectedBuyPage() {
  const walletsQuery = useWallets();
  const simulateMutation = useSimulateTransaction();
  const trackMutation = useTrackTransaction();

  const [walletId, setWalletId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [value, setValue] = useState('0');
  const [data, setData] = useState('');
  const [assetCode, setAssetCode] = useState('ETH');
  const [amount, setAmount] = useState('0.01');
  const [operationId, setOperationId] = useState('');
  const [txHash, setTxHash] = useState('');
  const [lastTrackStatus, setLastTrackStatus] = useState<string | null>(null);

  const wallets = walletsQuery.data?.items ?? [];
  const selectedWallet = wallets.find(wallet => wallet.id === walletId) ?? wallets[0] ?? null;
  const network = selectedWallet?.network ?? null;
  const canSimulate = Boolean(selectedWallet && recipient.trim());

  const simulationSummary = useMemo(() => {
    if (simulateMutation.data) {
      return simulateMutation.data.allowed
        ? 'Simulation passed. This transaction can be tracked.'
        : `Simulation blocked: ${simulateMutation.data.reason ?? 'Unknown risk'}`;
    }

    return 'Run simulation before tracking a submitted operation.';
  }, [simulateMutation.data]);

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Execution"
          title="Simulate first, then track execution in the ledger."
          description="Direct chain reconciliation and manual reported-hash flow have been removed. V1 routes all transaction lifecycle state through simulation gates and backend ledger tracking."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Linked Wallets" value={`${wallets.length}`} />
          <DataKicker label="Network" value={network ?? 'Select wallet'} />
          <DataKicker label="Simulation" value={simulateMutation.data?.allowed ? 'PASS' : simulateMutation.data ? 'BLOCKED' : 'Not run'} />
          <DataKicker label="Tracked Status" value={lastTrackStatus ?? 'None'} />
        </div>
      </GlassPanel>

      {wallets.length === 0 ? (
        <GlassPanel className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--cyan)]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text)]">No linked wallet yet</div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Link an embedded Alchemy wallet first.
              </p>
              <Button className="mt-4" variant="brand" asChild>
                <Link href="/app/wallets">Open wallets</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <GlassPanel className="p-6 space-y-4">
            <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
              Pre-Send Simulation
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Wallet</span>
              <select
                value={walletId}
                onChange={event => setWalletId(event.target.value)}
                className="h-12 w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 text-[var(--text)]"
              >
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.network} • {wallet.address}
                  </option>
                ))}
              </select>
            </label>

            <Input
              value={recipient}
              onChange={event => setRecipient(event.target.value)}
              placeholder="Recipient contract/address"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />
            <Input
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder="Value (hex wei or decimal string)"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />
            <Input
              value={data}
              onChange={event => setData(event.target.value)}
              placeholder="Calldata (optional)"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />

            <Button
              variant="brand"
              className="w-full"
              disabled={!canSimulate || simulateMutation.isPending || !selectedWallet}
              onClick={async () => {
                if (!selectedWallet) {
                  return;
                }

                try {
                  const result = await simulateMutation.mutateAsync({
                    walletId: selectedWallet.id,
                    network: selectedWallet.network,
                    to: recipient,
                    value: value || undefined,
                    data: data || undefined,
                  });

                  if (result.allowed) {
                    toast.success('Simulation passed');
                  } else {
                    toast.error(result.reason ?? 'Simulation blocked');
                  }
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Simulation request failed');
                }
              }}
            >
              {simulateMutation.isPending ? 'Simulating...' : 'Run simulation'}
            </Button>
          </GlassPanel>

          <GlassPanel className="p-6 space-y-4">
            <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
              Ledger Tracking
            </div>

            <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]">
              {simulationSummary}
            </div>

            <Input
              value={assetCode}
              onChange={event => setAssetCode(event.target.value.toUpperCase())}
              placeholder="Asset code (e.g. ETH, USDC)"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />
            <Input
              value={amount}
              onChange={event => setAmount(event.target.value)}
              placeholder="Amount"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />
            <Input
              value={operationId}
              onChange={event => setOperationId(event.target.value)}
              placeholder="Alchemy operation id (optional)"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />
            <Input
              value={txHash}
              onChange={event => setTxHash(event.target.value)}
              placeholder="Transaction hash (optional)"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />

            <Button
              variant="brand"
              className="w-full"
              disabled={
                !selectedWallet
                || !simulateMutation.data?.allowed
                || !simulateMutation.data?.simulationId
                || trackMutation.isPending
              }
              onClick={async () => {
                if (!selectedWallet) {
                  return;
                }

                if (!simulateMutation.data?.simulationId) {
                  toast.error('Simulation token missing. Run simulation again.');
                  return;
                }

                try {
                  const tracked = await trackMutation.mutateAsync({
                    walletId: selectedWallet.id,
                    network: selectedWallet.network,
                    assetCode,
                    amount,
                    simulationId: simulateMutation.data.simulationId,
                    to: recipient,
                    value: value || undefined,
                    data: data || undefined,
                    operationId: operationId || undefined,
                    txHash: txHash || undefined,
                  });
                  setLastTrackStatus(tracked.status);
                  toast.success('Transaction tracked');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Could not track transaction');
                }
              }}
            >
              {trackMutation.isPending ? 'Tracking...' : 'Track transaction'}
            </Button>

            {lastTrackStatus ? (
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <StatusPill status={lastTrackStatus} />
              </div>
            ) : null}

            <div className="rounded-[1rem] border border-cyan-400/15 bg-cyan-400/8 p-4 text-sm text-cyan-100">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Risk policy
              </div>
              <p className="mt-2">
                Simulation failures block tracking in v1 to prevent unsafe transaction submissions.
              </p>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
