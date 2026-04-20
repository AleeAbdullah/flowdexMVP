'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, CheckCircle2, Coins, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCreatePurchaseIntent,
  useReportPurchaseTransaction,
  useTransaction,
  useWallets,
} from '@/dal/app/hooks';
import { usePresaleConfig, usePresaleStats, usePricing } from '@/dal/market/hooks';
import { DataKicker, GlassPanel, SectionHeading, StatusPill } from './primitives';
import { formatCompact, formatCurrency, formatDateTime, formatPlainNumber, parseDecimal, truncateMiddle } from './utils';

export function ProtectedBuyPage() {
  const walletsQuery = useWallets();
  const pricingQuery = usePricing();
  const statsQuery = usePresaleStats();
  const configQuery = usePresaleConfig();
  const createIntentMutation = useCreatePurchaseIntent();

  const [walletId, setWalletId] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('100');
  const [reportedTxHash, setReportedTxHash] = useState('');
  const [activeIntentId, setActiveIntentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: 'info' | 'success' | 'error';
    text: string;
  } | null>(null);

  const wallets = walletsQuery.data?.items ?? [];
  const supportedAssets = configQuery.data?.supportedAssets ?? [];
  const pricingItems = pricingQuery.data?.items ?? [];
  const stats = statsQuery.data;
  const activeTransactionQuery = useTransaction(activeIntentId ?? '');
  const activeTransaction = activeTransactionQuery.data;
  const isBootstrapping = walletsQuery.isLoading || pricingQuery.isLoading || statsQuery.isLoading || configQuery.isLoading;
  const bootError = walletsQuery.error || pricingQuery.error || statsQuery.error || configQuery.error;

  useEffect(() => {
    if (!walletId && wallets[0]) {
      setWalletId(wallets[0].id);
    }
  }, [walletId, wallets]);

  useEffect(() => {
    if (!assetCode && supportedAssets[0]) {
      setAssetCode(supportedAssets[0].assetCode);
    }
  }, [assetCode, supportedAssets]);

  const selectedAsset = supportedAssets.find(item => item.assetCode === assetCode) ?? supportedAssets[0];
  const selectedPrice = pricingItems.find(item => item.assetCode === selectedAsset?.assetCode);
  const normalizedPaymentAmount = parseDecimal(paymentAmount);
  const minimumAmount = parseDecimal(selectedAsset?.minAmount ?? 0);
  const estimatedTokens = stats && selectedPrice
    ? (normalizedPaymentAmount * parseDecimal(selectedPrice.priceUsd)) / parseDecimal(stats.currentTokenPriceUsd)
    : 0;
  const amountValidationMessage = !paymentAmount.trim()
    ? 'Enter an amount to generate a purchase intent.'
    : normalizedPaymentAmount <= 0
      ? 'Enter a valid payment amount greater than zero.'
      : selectedAsset && normalizedPaymentAmount < minimumAmount
        ? `The minimum supported amount is ${formatPlainNumber(selectedAsset.minAmount, 6)} ${selectedAsset.assetCode}.`
        : null;
  const canCreateIntent = Boolean(walletId && assetCode && !amountValidationMessage);
  const isIntentFinal = activeTransaction
    ? ['CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(activeTransaction.status)
    : false;

  const reportTxMutation = useReportPurchaseTransaction(activeIntentId ?? '');

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Protected Buy"
          title="Create and track purchase intents inside the authenticated app shell."
          description="This screen now follows the validated backend lifecycle closely: create an intent, send funds, optionally report the chain hash, and watch the backend move the transaction through confirmation or failure states."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Current Tier" value={`Tier ${stats?.currentTier ?? 1}`} />
          <DataKicker label="Token Price" value={formatCurrency(stats?.currentTokenPriceUsd ?? 0, 3)} />
          <DataKicker label="Linked Wallets" value={`${wallets.length}`} />
          <DataKicker label="Accepted Assets" value={`${supportedAssets.length}`} />
        </div>
      </GlassPanel>

      {feedback ? (
        <GlassPanel
          className={`p-5 ${feedback.tone === 'error'
              ? 'border border-rose-400/20 bg-rose-500/10'
              : feedback.tone === 'success'
                ? 'border border-emerald-400/20 bg-emerald-500/10'
                : 'border border-cyan-400/20 bg-cyan-400/10'
            }`}
        >
          <p className="text-sm leading-7 text-[var(--text)]">{feedback.text}</p>
        </GlassPanel>
      ) : null}

      {isBootstrapping ? (
        <GlassPanel className="p-6 text-sm text-[var(--muted)]">
          Loading protected buy rails, pricing, and linked wallet readiness...
        </GlassPanel>
      ) : null}

      {!isBootstrapping && bootError ? (
        <GlassPanel className="border border-rose-400/20 bg-rose-500/10 p-6">
          <div className="text-lg font-bold text-[var(--text)]">Protected buy is unavailable right now</div>
          <p className="mt-3 text-sm leading-7 text-rose-100">
            {bootError instanceof Error ? bootError.message : 'The app could not load the required backend data.'}
          </p>
        </GlassPanel>
      ) : null}

      {!isBootstrapping && !bootError && wallets.length === 0 ? (
        <GlassPanel className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--cyan)]">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text)]">No linked wallet yet</div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                The protected buy flow depends on a verified wallet. Link one first, then return here to generate a purchase intent.
              </p>
              <Button className="mt-4" variant="brand" asChild>
                <Link href="/app/wallets">Go to wallets</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>
      ) : !isBootstrapping && !bootError ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <GlassPanel className="p-6">
            <div className="space-y-4">
              <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Create Purchase Intent</div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Wallet</span>
                <select
                  value={walletId}
                  onChange={event => setWalletId(event.target.value)}
                  className="h-12 w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 text-[var(--text)]"
                >
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.chain} • {wallet.address}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Payment Asset</span>
                <div className="flex flex-wrap gap-2">
                  {supportedAssets.map(asset => (
                    <button
                      key={asset.assetCode}
                      type="button"
                      onClick={() => setAssetCode(asset.assetCode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${assetCode === asset.assetCode ? 'bg-cyan-400 text-slate-950' : 'border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--muted)]'}`}
                    >
                      {asset.assetCode}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Amount</span>
                <Input
                  value={paymentAmount}
                  onChange={event => setPaymentAmount(event.target.value)}
                  inputMode="decimal"
                  className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
                />
              </label>

              <div className="rounded-[1.25rem] border border-cyan-400/12 bg-cyan-400/6 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <ArrowRightLeft className="h-4 w-4" />
                  Execution Preview
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <DataKicker label="Asset USD Price" value={formatCurrency(selectedPrice?.priceUsd ?? 0, 2)} />
                  <DataKicker label="Estimated Tokens" value={formatCompact(estimatedTokens, 2)} />
                  <DataKicker
                    label="Min Amount"
                    value={selectedAsset ? `${formatPlainNumber(selectedAsset.minAmount, 6)} ${selectedAsset.assetCode}` : '0'}
                  />
                  <DataKicker label="Confirmations" value={`${selectedAsset?.minConfirmations ?? 0}`} />
                </div>
              </div>

              {amountValidationMessage ? (
                <div className="rounded-[1rem] border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-700">
                  {amountValidationMessage}
                </div>
              ) : null}

              <Button
                variant="brand"
                size="lg"
                className="w-full"
                disabled={createIntentMutation.isPending || !canCreateIntent}
                onClick={async () => {
                  if (amountValidationMessage) {
                    setFeedback({
                      tone: 'error',
                      text: amountValidationMessage,
                    });
                    return;
                  }

                  try {
                    const result = await createIntentMutation.mutateAsync({
                      walletId,
                      assetCode,
                      paymentAmount,
                    });

                    setActiveIntentId(result.intentId);
                    setReportedTxHash('');
                    setFeedback({
                      tone: 'success',
                      text: `Intent ${result.intentId.slice(0, 8)} is live. Send ${result.paymentAmount} ${result.assetCode} to the treasury address below, then optionally report the transaction hash to accelerate reconciliation.`,
                    });
                    toast.success('Purchase intent created');
                  } catch (error) {
                    setFeedback({
                      tone: 'error',
                      text: error instanceof Error ? error.message : 'Could not create purchase intent',
                    });
                    toast.error(error instanceof Error ? error.message : 'Could not create purchase intent');
                  }
                }}
              >
                {createIntentMutation.isPending ? 'Creating intent...' : 'Create purchase intent'}
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            {createIntentMutation.data ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Payment instructions ready</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DataKicker label="Intent ID" value={createIntentMutation.data.intentId.slice(0, 8)} />
                  <DataKicker label="Tier" value={`Tier ${createIntentMutation.data.currentTier}`} />
                  <div className="space-y-2">
                    <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_45%,transparent)] uppercase">Lifecycle</div>
                    <StatusPill status={activeTransaction?.status ?? 'PENDING'} />
                  </div>
                  <DataKicker label="Confirmations" value={`${activeTransaction?.confirmations ?? 0}`} />
                  <DataKicker label="Pay To" value={createIntentMutation.data.paymentAddress} className="sm:col-span-2" />
                  <DataKicker label="Amount" value={`${createIntentMutation.data.paymentAmount} ${createIntentMutation.data.assetCode}`} />
                  <DataKicker label="Tokens Preview" value={formatCompact(createIntentMutation.data.tokensAllocatedPreview, 2)} />
                  <DataKicker
                    label="Reported Hash"
                    value={activeTransaction?.reportedTxHash ? truncateMiddle(activeTransaction.reportedTxHash) : (reportedTxHash.trim() ? truncateMiddle(reportedTxHash) : 'Not submitted yet')}
                  />
                  <DataKicker
                    label="Matched Hash"
                    value={activeTransaction?.matchedTxHash ? truncateMiddle(activeTransaction.matchedTxHash) : 'Not matched yet'}
                  />
                  <DataKicker
                    label="Confirmed At"
                    value={formatDateTime(activeTransaction?.confirmedAt)}
                    className="sm:col-span-2"
                  />
                </div>

                {activeTransaction?.verificationFailureReason ? (
                  <div className="rounded-[1rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    Backend verification issue: {activeTransaction.verificationFailureReason}
                  </div>
                ) : null}

                <div className="rounded-[1.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                  <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Optional tx hint</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    Once funds are sent, report the chain hash here to help the backend find and verify the transfer faster. Reporting a hash does not confirm the transaction by itself.
                  </p>
                  <Input
                    value={reportedTxHash}
                    onChange={event => setReportedTxHash(event.target.value)}
                    placeholder="Paste transaction hash"
                    className="mt-4 h-12 border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_32%,var(--card-bg))] text-[var(--text)]"
                  />
                  <Button
                    variant="glass"
                    className="mt-4 w-full"
                    disabled={reportTxMutation.isPending || !activeIntentId || !reportedTxHash.trim() || isIntentFinal}
                    onClick={async () => {
                      if (!activeIntentId) {
                        return;
                      }

                      try {
                        await reportTxMutation.mutateAsync({ txHash: reportedTxHash });
                        setFeedback({
                          tone: 'info',
                          text: `Transaction hash ${reportedTxHash} was submitted. The backend will reconcile it, attach verification results, and keep this lifecycle panel updated as confirmations progress.`,
                        });
                        toast.success('Transaction hash submitted');
                      } catch (error) {
                        setFeedback({
                          tone: 'error',
                          text: error instanceof Error ? error.message : 'Could not report transaction',
                        });
                        toast.error(error instanceof Error ? error.message : 'Could not report transaction');
                      }
                    }}
                  >
                    {reportTxMutation.isPending ? 'Submitting...' : 'Report transaction hash'}
                  </Button>
                  {activeTransactionQuery.isError ? (
                    <p className="mt-3 text-sm text-rose-200">
                      {activeTransactionQuery.error instanceof Error
                        ? activeTransactionQuery.error.message
                        : 'The latest transaction lifecycle state could not be refreshed.'}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="brand" asChild className="w-full">
                    <Link href="/app/transactions">Go to transaction history</Link>
                  </Button>
                  {activeIntentId ? (
                    <Button variant="glass" asChild className="w-full">
                      <Link href={`/app/transactions/${activeIntentId}`}>Open transaction detail</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--text)]">
                  <Coins className="h-5 w-5 text-cyan-300" />
                  <span className="font-semibold">Execution will appear here</span>
                </div>
                <p className="text-sm leading-7 text-[var(--muted)]">
                  Once a purchase intent is created, this panel will show the payment address, quoted prices, preview token allocation, and optional transaction reporting flow.
                </p>
              </div>
            )}
          </GlassPanel>
        </div>
      ) : null}
    </div>
  );
}
