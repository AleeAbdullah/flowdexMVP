'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Coins, CreditCard, Layers3, ShieldCheck, Wallet } from 'lucide-react';
import { usePresaleConfig, usePresaleStats, usePresaleTiers, usePricing } from '@/dal/market/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { formatCompact, formatCurrency, formatPercent, parseDecimal } from './utils';

const showcaseAssets = ['Bitcoin', 'Tesla', 'Gold', 'EUR/USD', 'S&P 500', 'Nvidia', 'ETFs', '500+ more'];

export function BuyPage() {
  const [mode, setMode] = useState<'buy' | 'stake'>('buy');
  const [paymentRail, setPaymentRail] = useState<'crypto' | 'card'>('crypto');
  const [selectedAssetCode, setSelectedAssetCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('100');

  const pricingQuery = usePricing();
  const statsQuery = usePresaleStats();
  const tiersQuery = usePresaleTiers();
  const configQuery = usePresaleConfig();

  const assets = configQuery.data?.supportedAssets ?? [];
  const pricing = pricingQuery.data?.items ?? [];
  const stats = statsQuery.data;
  const tiers = tiersQuery.data?.items ?? [];

  useEffect(() => {
    if (!selectedAssetCode && assets[0]) {
      setSelectedAssetCode(assets[0].assetCode);
    }
  }, [assets, selectedAssetCode]);

  const selectedAsset = assets.find(asset => asset.assetCode === selectedAssetCode) ?? assets[0];
  const selectedPricing = pricing.find(item => item.assetCode === selectedAsset?.assetCode);

  const paymentAmountNumber = parseDecimal(paymentAmount);
  const assetPriceUsd = parseDecimal(selectedPricing?.priceUsd);
  const tokenPriceUsd = parseDecimal(stats?.currentTokenPriceUsd);
  const estimatedTokens = tokenPriceUsd > 0 ? (paymentAmountNumber * assetPriceUsd) / tokenPriceUsd : 0;

  const currentTierCap = tiers.find(tier => tier.order === stats?.currentTier)?.tokenCapReal;
  const tierProgress = currentTierCap
    ? Math.min(100, (parseDecimal(stats?.tokensSoldReal) / parseDecimal(currentTierCap)) * 100)
    : 0;

  const scenarioMultipliers = [1, 5, 10, 50];
  const supply = 10_000_000_000;

  return (
    <div className="section-shell section-pad space-y-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Buy Flow"
            title="A presale screen that already speaks the backend contract."
            description="This first milestone stays read-only for protected actions, but the pricing, supported assets, and tier state all come from the live backend. That makes this page a real integration surface, not a static mock."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <GlassPanel className="p-5">
              <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Current Price</div>
              <div className="font-data mt-4 text-3xl text-white">
                {stats ? formatCurrency(stats.currentTokenPriceUsd, 3) : '$0.001'}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Tier {stats?.currentTier ?? 1} is live and reflected directly from the backend presale stats.
              </p>
            </GlassPanel>
            <GlassPanel className="p-5">
              <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Display Raise</div>
              <div className="font-data mt-4 text-3xl text-white">
                {stats ? formatCurrency(stats.fundsRaisedDisplayUsd, 0) : '$0'}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The 10x presentation multiplier is handled in the response layer, not the stored backend values.
              </p>
            </GlassPanel>
          </div>

          <GlassPanel className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/8 p-3 text-cyan-200">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">Asset Showcase</div>
                <p className="text-sm text-slate-300">Universal exchange positioning across crypto and TradFi-native surfaces.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {showcaseAssets.map(asset => (
                <span
                  key={asset}
                  className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
                >
                  {asset}
                </span>
              ))}
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Tier Progress</div>
              <div className="mt-2 text-2xl font-black text-white">Tier {stats?.currentTier ?? 1}</div>
            </div>
            <div className="font-data text-cyan-200">{formatPercent(tierProgress || 0)}</div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/7">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${tierProgress}%` }} />
          </div>

          <div className="mt-6 grid gap-3">
            {tiers.map(tier => {
              const isActive = tier.order === stats?.currentTier;
              return (
                <div key={tier.id} className={`rounded-2xl border px-4 py-3 ${isActive ? 'border-cyan-400/35 bg-cyan-400/8' : 'border-white/8 bg-white/4'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-white">Tier {tier.order}</div>
                      <div className="font-data mt-1 text-sm text-slate-300">{formatCurrency(tier.tokenPriceUsd, 3)}</div>
                    </div>
                    <div className="font-data text-xs text-slate-400">{formatCompact(tier.tokenCapReal, 1)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="p-6 md:p-7">
          <div className="flex flex-wrap gap-3">
            {(['buy', 'stake'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${mode === option ? 'bg-cyan-400 text-slate-950' : 'border border-white/8 bg-white/4 text-slate-300'}`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {([
              { key: 'crypto', label: 'Crypto', icon: Wallet },
              { key: 'card', label: 'Card', icon: CreditCard },
            ] as const).map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPaymentRail(option.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${paymentRail === option.key ? 'bg-white text-slate-950' : 'border border-white/8 bg-white/4 text-slate-300'}`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">Accepted Assets</div>
              <div className="flex flex-wrap gap-2">
                {assets.map(asset => (
                  <button
                    key={asset.assetCode}
                    type="button"
                    onClick={() => setSelectedAssetCode(asset.assetCode)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedAssetCode === asset.assetCode ? 'bg-cyan-400 text-slate-950' : 'border border-white/8 bg-white/4 text-slate-300'}`}
                  >
                    {asset.assetCode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/8 bg-[#071423] p-4">
                <div className="text-[10px] font-bold tracking-[0.24em] text-slate-500 uppercase">You Pay</div>
                <Input
                  value={paymentAmount}
                  onChange={event => setPaymentAmount(event.target.value)}
                  inputMode="decimal"
                  className="mt-4 h-14 border-0 bg-transparent px-0 text-3xl font-semibold text-white placeholder:text-slate-500"
                />
                <div className="mt-3 text-sm text-slate-400">{selectedAsset?.assetCode ?? 'Select asset'}</div>
              </div>

              <div className="rounded-[1.25rem] border border-white/8 bg-[#071423] p-4">
                <div className="text-[10px] font-bold tracking-[0.24em] text-slate-500 uppercase">You Receive</div>
                <div className="font-data mt-4 text-3xl text-white">{formatCompact(estimatedTokens, 2)}</div>
                <div className="mt-3 text-sm text-slate-400">$FDN preview at current tier pricing</div>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-cyan-400/12 bg-cyan-400/6 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                <ArrowRightLeft className="h-4 w-4" />
                Buy Widget Summary
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <DataKicker label="Asset USD Price" value={formatCurrency(selectedPricing?.priceUsd ?? 0, 2)} />
                <DataKicker label="Token Price" value={formatCurrency(stats?.currentTokenPriceUsd ?? 0, 3)} />
                <DataKicker label="Min Amount" value={selectedAsset?.minAmount ?? '0'} />
                <DataKicker label="Confirmations" value={`${selectedAsset?.minConfirmations ?? 0}`} />
              </div>
            </div>

            <Button variant="brand" size="lg" className="w-full" asChild>
              <Link href="/app/buy">Continue to protected buy</Link>
            </Button>
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <SectionHeading
            eyebrow="Market Cap Scenarios"
            title="Let the ROI framing sit next to real tier data."
            description="These cards turn the current backend price into scenario planning. They are intentionally framed as directional upside references, not guarantees."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {scenarioMultipliers.map(multiplier => {
              const scenarioPrice = (tokenPriceUsd || 0.001) * multiplier;
              const fdv = scenarioPrice * supply;
              const roi = tokenPriceUsd > 0 ? ((scenarioPrice - tokenPriceUsd) / tokenPriceUsd) * 100 : 0;

              return (
                <GlassPanel key={multiplier} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-lg font-bold text-white">{multiplier === 1 ? 'Listing' : `${multiplier}x Scenario`}</div>
                    <div className="rounded-full border border-white/8 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-300">
                      {formatPercent(roi)}
                    </div>
                  </div>
                  <div className="font-data mt-4 text-2xl text-cyan-200">{formatCurrency(scenarioPrice, 3)}</div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <Coins className="h-4 w-4 text-cyan-300" />
                    Implied FDV {formatCurrency(fdv, 0)}
                  </div>
                </GlassPanel>
              );
            })}
          </div>

          <GlassPanel className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">Read-only by design for phase one</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  This page already consumes live pricing and presale config from the backend, but protected purchase actions stay deferred until the Better Auth BFF bridge is in place.
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
