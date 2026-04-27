'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSimulateTransaction, useTrackTransaction, useWallets } from '@/dal/app/hooks';
import { Env } from '@/libs/Env';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from './primitives';

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

function toHexValue(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '0x0';
  }
  if (trimmed.startsWith('0x')) {
    return trimmed;
  }
  return `0x${BigInt(trimmed).toString(16)}`;
}

export function ProtectedBuyPage() {
  const walletsQuery = useWallets();
  const simulateMutation = useSimulateTransaction();
  const trackMutation = useTrackTransaction();

  const [walletId, setWalletId] = useState('');
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
  const treasuryRecipient = useMemo(() => {
    if (!selectedWallet) {
      return '';
    }
    return selectedWallet.network === 'BASE_SEPOLIA'
      ? (Env.NEXT_PUBLIC_TREASURY_ADDRESS_BASE_SEPOLIA ?? '')
      : (Env.NEXT_PUBLIC_TREASURY_ADDRESS_ETH_SEPOLIA ?? '');
  }, [selectedWallet]);
  const canSimulate = Boolean(selectedWallet && treasuryRecipient.trim());

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
          title="Buy and track execution in the ledger."
          description="Recipient is fixed to your configured treasury address. V1 still runs risk checks automatically before broadcast/track."
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
              Buy Setup
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

            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                Recipient (Treasury)
              </div>
              <Input
                value={treasuryRecipient}
                readOnly
                className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
              />
            </div>
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
                    chainId: selectedWallet.chainId,
                    to: treasuryRecipient,
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
              {simulateMutation.isPending ? 'Preparing buy...' : 'Buy'}
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
                    chainId: selectedWallet.chainId,
                    assetCode,
                    amount,
                    simulationId: simulateMutation.data.simulationId,
                    to: treasuryRecipient,
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

            {selectedWallet?.provider === 'METAMASK' ? (
              <Button
                variant="glass"
                className="w-full"
              disabled={
                  !selectedWallet
                  || trackMutation.isPending
                  || !treasuryRecipient.trim()
                }
                onClick={async () => {
                  if (!selectedWallet || !treasuryRecipient.trim()) {
                    return;
                  }

                  try {
                    const simulation = await simulateMutation.mutateAsync({
                      walletId: selectedWallet.id,
                      network: selectedWallet.network,
                      chainId: selectedWallet.chainId,
                      to: treasuryRecipient,
                      value: value || undefined,
                      data: data || undefined,
                    });
                    if (!simulation.allowed || !simulation.simulationId) {
                      toast.error(simulation.reason ?? 'Buy blocked by risk checks');
                      return;
                    }

                    const ethereum = getEthereumProvider();
                    if (!ethereum) {
                      toast.error('MetaMask not available');
                      return;
                    }

                    const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
                    const account = String(accounts[0] ?? '').toLowerCase();
                    if (!account || account !== selectedWallet.address.toLowerCase()) {
                      toast.error('Connected MetaMask account does not match selected wallet');
                      return;
                    }

                    const chainHex = await ethereum.request({ method: 'eth_chainId' }) as string;
                    const chainId = Number.parseInt(chainHex, 16);
                    if (chainId !== selectedWallet.chainId) {
                      toast.error(`Switch MetaMask to ${selectedWallet.network}`);
                      return;
                    }

                    const broadcast = await ethereum.request({
                      method: 'eth_sendTransaction',
                      params: [{
                        from: account,
                        to: treasuryRecipient,
                        value: toHexValue(value),
                        data: data || undefined,
                      }],
                    }) as string;

                    setTxHash(broadcast);
                    const tracked = await trackMutation.mutateAsync({
                      walletId: selectedWallet.id,
                      network: selectedWallet.network,
                      chainId: selectedWallet.chainId,
                      assetCode,
                      amount,
                      simulationId: simulation.simulationId,
                      to: treasuryRecipient,
                      value: value || undefined,
                      data: data || undefined,
                      txHash: broadcast,
                    });
                    setLastTrackStatus(tracked.status);
                    toast.success('MetaMask transaction broadcast and tracked');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'MetaMask send failed');
                  }
                }}
              >
                Buy with MetaMask
              </Button>
            ) : null}

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
