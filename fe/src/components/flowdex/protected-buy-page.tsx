'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, CheckCircle2, Coins, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreatePurchaseIntent, useReportPurchaseTransaction, useWallets } from '@/dal/app/hooks';
import { usePresaleConfig, usePresaleStats, usePricing } from '@/dal/market/hooks';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { formatCompact, formatCurrency, parseDecimal } from './utils';

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

  const wallets = walletsQuery.data?.items ?? [];
  const supportedAssets = configQuery.data?.supportedAssets ?? [];
  const pricingItems = pricingQuery.data?.items ?? [];
  const stats = statsQuery.data;

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
  const estimatedTokens = stats && selectedPrice
    ? (parseDecimal(paymentAmount) * parseDecimal(selectedPrice.priceUsd)) / parseDecimal(stats.currentTokenPriceUsd)
    : 0;

  const reportTxMutation = useReportPurchaseTransaction(activeIntentId ?? '');

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Protected Buy"
          title="Create purchase intents from the authenticated app shell."
          description="This route is the first true protected execution surface: it knows who the user is, what wallets they linked, and which backend-supported rails are currently available."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Current Tier" value={`Tier ${stats?.currentTier ?? 1}`} />
          <DataKicker label="Token Price" value={formatCurrency(stats?.currentTokenPriceUsd ?? 0, 3)} />
          <DataKicker label="Linked Wallets" value={`${wallets.length}`} />
          <DataKicker label="Accepted Assets" value={`${supportedAssets.length}`} />
        </div>
      </GlassPanel>

      {wallets.length === 0 ? (
        <GlassPanel className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">No linked wallet yet</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The protected buy flow depends on a verified wallet. Link one first, then return here to generate a purchase intent.
              </p>
              <Button className="mt-4" variant="brand" asChild>
                <Link href="/app/wallets">Go to wallets</Link>
              </Button>
            </div>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <GlassPanel className="p-6">
            <div className="space-y-4">
              <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Create Purchase Intent</div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Wallet</span>
                <select
                  value={walletId}
                  onChange={event => setWalletId(event.target.value)}
                  className="h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-white"
                >
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.chain} • {wallet.address}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Payment Asset</span>
                <div className="flex flex-wrap gap-2">
                  {supportedAssets.map(asset => (
                    <button
                      key={asset.assetCode}
                      type="button"
                      onClick={() => setAssetCode(asset.assetCode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${assetCode === asset.assetCode ? 'bg-cyan-400 text-slate-950' : 'border border-white/8 bg-white/4 text-slate-300'}`}
                    >
                      {asset.assetCode}
                    </button>
                  ))}
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Amount</span>
                <Input
                  value={paymentAmount}
                  onChange={event => setPaymentAmount(event.target.value)}
                  inputMode="decimal"
                  className="h-12 border-white/10 bg-white/5 text-white"
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
                  <DataKicker label="Min Amount" value={selectedAsset?.minAmount ?? '0'} />
                  <DataKicker label="Confirmations" value={`${selectedAsset?.minConfirmations ?? 0}`} />
                </div>
              </div>

              <Button
                variant="brand"
                size="lg"
                className="w-full"
                disabled={createIntentMutation.isPending || !walletId || !assetCode}
                onClick={async () => {
                  try {
                    const result = await createIntentMutation.mutateAsync({
                      walletId,
                      assetCode,
                      paymentAmount,
                    });

                    setActiveIntentId(result.intentId);
                    setReportedTxHash('');
                    toast.success('Purchase intent created');
                  } catch (error) {
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
                  <DataKicker label="Pay To" value={createIntentMutation.data.paymentAddress} className="sm:col-span-2" />
                  <DataKicker label="Amount" value={`${createIntentMutation.data.paymentAmount} ${createIntentMutation.data.assetCode}`} />
                  <DataKicker label="Tokens Preview" value={formatCompact(createIntentMutation.data.tokensAllocatedPreview, 2)} />
                </div>

                <div className="rounded-[1.25rem] border border-white/8 bg-white/4 p-4">
                  <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Optional tx hint</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    If the user already sent funds, they can report the transaction hash here to help reconciliation pick it up faster.
                  </p>
                  <Input
                    value={reportedTxHash}
                    onChange={event => setReportedTxHash(event.target.value)}
                    placeholder="Paste transaction hash"
                    className="mt-4 h-12 border-white/10 bg-[#071423] text-white"
                  />
                  <Button
                    variant="glass"
                    className="mt-4 w-full"
                    disabled={reportTxMutation.isPending || !activeIntentId || !reportedTxHash.trim()}
                    onClick={async () => {
                      if (!activeIntentId) {
                        return;
                      }

                      try {
                        await reportTxMutation.mutateAsync({ txHash: reportedTxHash });
                        toast.success('Transaction hash submitted');
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : 'Could not report transaction');
                      }
                    }}
                  >
                    {reportTxMutation.isPending ? 'Submitting...' : 'Report transaction hash'}
                  </Button>
                </div>

                <Button variant="brand" asChild className="w-full">
                  <Link href="/app/transactions">Go to transaction history</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-white">
                  <Coins className="h-5 w-5 text-cyan-300" />
                  <span className="font-semibold">Execution will appear here</span>
                </div>
                <p className="text-sm leading-7 text-slate-300">
                  Once a purchase intent is created, this panel will show the payment address, quoted prices, preview token allocation, and optional transaction reporting flow.
                </p>
              </div>
            )}
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
