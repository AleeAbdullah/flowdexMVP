'use client';

import {
  Banknote,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Gem,
  Info,
  Lock,
  Sparkles,
  Trophy,
  Wallet,
  type Icon as LucideIcon,
} from '@/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ASSET_SHOWCASE,
  LEADERBOARD,
  LIVE_ACTIVITY,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_METRICS,
  QUICK_BUY_AMOUNTS,
  SCENARIOS,
} from './buy-page-content';
import type { BuyAssetOption, BuyMarketModel } from './buy-page-types';
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  formatPlainNumber,
} from './utils';

export function BuyHeroSection(props: {
  market: BuyMarketModel;
  walletConnected: boolean;
  onWalletClick: () => void;
}) {
  return (
    <Card className="buy-page-hero overflow-hidden border-[color-mix(in_srgb,var(--accent-strong)_20%,var(--card-border))]">
      <CardContent className="space-y-6 p-5 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="brand" className="gap-2 text-[var(--accent-strong)]">
                <span className="h-2 w-2 rounded-full bg-[var(--green)] shadow-[0_0_12px_var(--green)]" />
                Tier {props.market.currentTier} Live
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    className="h-7 rounded-full px-3 text-[10px] tracking-[0.24em] uppercase"
                  >
                    <Info aria-hidden="true" className="h-3.5 w-3.5" />
                    preview panels
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border-[var(--card-border)] bg-[var(--bg-2)] text-[var(--text)]">
                  Portfolio, leaderboard, staking, and referral values are preview samples for the public route.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-black tracking-tight text-[var(--text)] md:text-5xl">
                Buy into the FlowDex presale with live market configuration.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)] md:text-base">
                Pricing, tier, and supported assets are backend-driven. Use this page for public presale entry and
                switch to the app route for authenticated execution flows.
              </p>
            </div>
          </div>

          <Button
            variant={props.walletConnected ? 'glass' : 'brand'}
            size="lg"
            className="min-w-[220px] self-start"
            onClick={props.onWalletClick}
          >
            {props.walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </Button>
        </div>

        <div className="buy-page-stage rounded-[1.5rem] border border-[color-mix(in_srgb,var(--accent-strong)_14%,var(--card-border))] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-[11px] font-bold tracking-[0.32em] text-[var(--accent-strong)] uppercase">
                Tier {props.market.currentTier} - Live
              </div>
              <div className="text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                {formatCurrency(props.market.fundsRaisedUsd, 2)}
                {props.market.targetRaisedUsd > 0
                  ? ` / ${formatCurrency(props.market.targetRaisedUsd, 2)} raised`
                  : ' raised'}
              </div>
            </div>
            <div className="text-sm font-semibold text-[color-mix(in_srgb,var(--text)_70%,transparent)]">
              {formatPercent(props.market.raisedProgressPercent)} filled
            </div>
          </div>

          <Progress
            value={props.market.raisedProgressPercent}
            className="mt-4 h-3 bg-[color-mix(in_srgb,var(--bg)_45%,var(--card-bg))]"
          />

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <MetricDisplay label="Price" value={formatCurrency(props.market.tokenPriceUsd, 3)} accent="cyan" />
            <MetricDisplay label="Discount" value={`-${props.market.discountPercent}%`} accent="green" />
            <MetricDisplay label="Listing" value={formatCurrency(props.market.listingReferenceUsd, 2)} />
            <MetricDisplay label="Updated" value={props.market.sourceUpdatedAt ? 'Live' : 'Preview'} />
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-[11px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
              Vesting Preview
            </div>
            <div className="grid overflow-hidden rounded-full border border-[var(--card-border)] bg-[var(--bg)] md:grid-cols-4">
              {props.market.vestingLabels.map(item => (
                <div
                  key={item}
                  className="flex min-h-12 items-center justify-center border-b border-[var(--card-border)] px-3 text-center text-[11px] font-semibold text-[color-mix(in_srgb,var(--text)_74%,transparent)] last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BuyTopInfoSection(props: { market: BuyMarketModel }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="buy-page-panel-soft">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:p-6">
          <MetricBlock label="Current Price" value={formatCurrency(props.market.tokenPriceUsd, 3)} accent="cyan" />
          <MetricBlock label="Listing Reference" value={formatCurrency(props.market.listingReferenceUsd, 2)} />
          <MetricBlock label="Discount" value={`${props.market.discountPercent}%`} accent="green" compact />
        </CardContent>
      </Card>

      <Card className="buy-page-panel-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--accent-strong)] uppercase">
            How To Buy
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pb-5 md:grid-cols-3">
          <StepCard icon={Wallet} step="1" title="Choose payment" description="Select crypto or card intent." />
          <StepCard icon={Banknote} step="2" title="Enter amount" description="Use quick-buy or custom." />
          <StepCard icon={CheckCircle2} step="3" title="Continue" description="Open authenticated flow." />
        </CardContent>
      </Card>
    </div>
  );
}

export function BuyFormSection(props: {
  market: BuyMarketModel;
  orderMode: string;
  paymentRail: string;
  selectedAssetCode: string;
  customAmount: string;
  activeQuickAmount: string;
  estimatedTokens: number;
  stakeBoostTokens: number;
  listingValue: number;
  assetUnits: number;
  selectedAsset: BuyAssetOption;
  onOrderModeChange: (value: string) => void;
  onPaymentRailChange: (value: string) => void;
  onAssetCodeChange: (value: string) => void;
  onQuickAmountChange: (value: string) => void;
  onCustomAmountChange: (value: string) => void;
  onPrimaryAction: () => void;
  walletConnected: boolean;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="buy-page-panel">
        <CardContent className="space-y-6 p-5 md:p-6">
          <ToggleGroup
            type="single"
            value={props.orderMode}
            onValueChange={(value) => value && props.onOrderModeChange(value)}
            className="grid w-full grid-cols-2 gap-3"
          >
            <ToggleGroupItem
              value="buy"
              variant="outline"
              className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--accent-bg)] font-semibold text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[color-mix(in_srgb,var(--accent-strong)_14%,transparent)] data-[state=on]:text-[var(--text)]"
            >
              Buy $FDN
            </ToggleGroupItem>
            <ToggleGroupItem
              value="stake"
              variant="outline"
              className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] font-semibold text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[color-mix(in_srgb,var(--accent-strong)_14%,transparent)] data-[state=on]:text-[var(--text)]"
            >
              Buy & Stake (≈15% APY)
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="space-y-3">
            <Label className="text-[11px] font-bold tracking-[0.32em] text-[var(--accent-strong)] uppercase">
              Payment Method
            </Label>
            <ToggleGroup
              type="single"
              value={props.paymentRail}
              onValueChange={(value) => value && props.onPaymentRailChange(value)}
              className="grid w-full grid-cols-2 gap-3"
            >
              <ToggleGroupItem
                value="crypto"
                variant="outline"
                className="h-16 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] text-base font-semibold text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)]"
              >
                <Wallet aria-hidden="true" className="h-4 w-4" />
                Crypto
              </ToggleGroupItem>
              <ToggleGroupItem
                value="card"
                variant="outline"
                className="h-16 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] text-base font-semibold text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)]"
              >
                <CreditCard aria-hidden="true" className="h-4 w-4" />
                Card
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--text)]">Select Currency</Label>
              <Select value={props.selectedAssetCode} onValueChange={props.onAssetCodeChange}>
                <SelectTrigger className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
                  <SelectValue placeholder="Choose a currency" />
                </SelectTrigger>
                <SelectContent className="border-[var(--card-border)] bg-[var(--bg-2)] text-[var(--text)]">
                  {props.market.assetOptions.map(asset => (
                    <SelectItem key={`${asset.code}-${asset.chain}`} value={asset.code}>
                      {asset.code} · {asset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--text)]">Quick Buy</Label>
              <ToggleGroup
                type="single"
                value={props.activeQuickAmount}
                onValueChange={(value) => value && props.onQuickAmountChange(value)}
                className="grid grid-cols-2 gap-3"
              >
                {QUICK_BUY_AMOUNTS.map(amount => (
                  <ToggleGroupItem
                    key={amount}
                    value={`${amount}`}
                    variant="outline"
                    className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] font-semibold text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[color-mix(in_srgb,var(--accent-strong)_12%,transparent)]"
                  >
                    ${formatPlainNumber(amount, 0)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="buy-amount" className="text-sm font-semibold text-[var(--text)]">Custom Amount (USD)</Label>
            <div className="rounded-[1.2rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_42%,var(--card-bg))] p-3 focus-within:border-[var(--accent-strong)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--accent-strong)_25%,transparent)]">
              <Input
                id="buy-amount"
                name="buyAmountUsd"
                value={props.customAmount}
                onChange={event => props.onCustomAmountChange(event.target.value)}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 1000…"
                aria-label="Custom amount in USD"
                className="h-16 border-0 bg-transparent px-2 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center justify-between px-2 pb-1 text-sm text-[var(--muted)]">
                <span>≈ {formatPlainNumber(props.assetUnits, 4)} {props.selectedAsset.symbol}</span>
                <span>{props.selectedAsset.code}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-[color-mix(in_srgb,var(--accent-strong)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)]">
              <CardContent className="space-y-2 p-5">
                <div className="text-[11px] font-bold tracking-[0.28em] text-[var(--accent-strong)] uppercase">
                  You Receive
                </div>
                <div className="font-data text-3xl font-bold text-[var(--text)]">
                  {formatCompact(props.estimatedTokens + props.stakeBoostTokens, 2)} $FDN
                </div>
                <div className="text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                  {props.orderMode === 'stake'
                    ? `${formatCompact(props.stakeBoostTokens, 2)} token bonus preview`
                    : `${formatCurrency(props.listingValue, 0)} listing reference value`}
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--card-border)] bg-[var(--card-bg)]">
              <CardContent className="space-y-3 p-5">
                <div className="text-[11px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_58%,transparent)] uppercase">
                  Buy Summary
                </div>
                <SummaryRow label="Payment rail" value={props.paymentRail === 'crypto' ? 'Crypto' : 'Card'} />
                <SummaryRow label="Settlement asset" value={props.selectedAsset.code} />
                <SummaryRow label="Presale price" value={formatCurrency(props.market.tokenPriceUsd, 3)} />
                <SummaryRow label="Listing reference" value={formatCurrency(props.market.listingReferenceUsd, 2)} />
              </CardContent>
            </Card>
          </div>

          <Button variant="brand" size="lg" className="h-14 w-full text-base" onClick={props.onPrimaryAction}>
            {props.walletConnected ? 'Continue to Secure Buy Flow' : 'Connect Wallet to Continue'}
          </Button>
        </CardContent>
      </Card>

      <BuySupportPanels market={props.market} estimatedTokens={props.estimatedTokens} />
    </div>
  );
}

function BuySupportPanels(props: { market: BuyMarketModel; estimatedTokens: number }) {
  return (
    <div className="space-y-5">
      <Card className="buy-page-panel">
        <CardHeader>
          <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--accent-strong)] uppercase">
            Market Cap Scenarios
          </CardTitle>
          <CardDescription>
            Narrative scenario previews based on the amount above.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map(scenario => {
            const price = props.market.tokenPriceUsd * scenario.multiplier;
            const value = props.estimatedTokens * price;

            return (
              <Card key={scenario.label} className="border-[var(--card-border)] bg-[var(--bg-2)] shadow-none hover:translate-y-0">
                <CardContent className="space-y-2 p-4">
                  <div className="font-data text-2xl font-bold text-[var(--accent-strong)]">{scenario.label}</div>
                  <div className="text-sm text-[color-mix(in_srgb,var(--text)_76%,transparent)]">
                    {formatCurrency(price, 2)} / FDN
                  </div>
                  <div className="text-sm text-[var(--green)]">
                    {value > 0 ? formatCurrency(value, 0) : '$0'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Card className="buy-page-panel">
        <CardHeader>
          <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--accent-strong)] uppercase">
            Live Activity
          </CardTitle>
          <CardDescription>Preview feed for social proof and motion on the public surface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LIVE_ACTIVITY.map((entry, index) => (
            <div
              key={`${entry.wallet}-${index}`}
              className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-data text-sm text-[color-mix(in_srgb,var(--text)_80%,transparent)]">
                  {entry.wallet}
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">now</div>
              </div>
              <div className="text-sm font-semibold text-[var(--accent-strong)]">{entry.asset}</div>
              <div className="text-right">
                <div className="font-data text-sm font-semibold text-[var(--green)]">
                  +{formatCurrency(entry.amountUsd, 0)}
                </div>
                <div className="text-xs text-[var(--muted)]">{entry.volume}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="buy-page-panel">
        <CardHeader>
          <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--accent-strong)] uppercase">
            How To Buy
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <StepTile
            icon={Wallet}
            title="Connect Wallet"
            description="Sign in and connect before moving into protected execution."
          />
          <StepTile
            icon={Coins}
            title="Choose Amount"
            description="Pick a quick amount or enter a custom value."
          />
          <StepTile
            icon={CheckCircle2}
            title="Continue"
            description="Use the app route for simulation checks and tracking."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function BuyHighlightsSection(props: { market: BuyMarketModel }) {
  return (
    <Card className="buy-page-panel">
      <CardContent className="space-y-5 p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {ASSET_SHOWCASE.map(asset => (
            <Badge key={asset} variant={asset === '500+ more' ? 'brand' : 'subtle'} className="px-4 py-2 tracking-[0.2em]">
              {asset}
            </Badge>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MiniStat label="Price" value={formatCurrency(props.market.tokenPriceUsd, 3)} />
          <MiniStat label="Listing" value={formatCurrency(props.market.listingReferenceUsd, 2)} />
          <MiniStat label="Discount" value={`-${props.market.discountPercent}%`} accent="green" />
          <MiniStat label="Staking APY" value={props.market.stakingApyText} accent="green" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioTabContent(props: {
  walletConnected: boolean;
  onConnectWallet: () => void;
}) {
  if (!props.walletConnected) {
    return (
      <Card className="buy-page-panel">
        <CardHeader>
          <CardTitle>My Portfolio</CardTitle>
          <CardDescription>Connect your wallet to view your $FDN portfolio snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <Wallet aria-hidden="true" className="h-14 w-14 text-[var(--accent-strong)]" />
          <div className="space-y-2">
            <div className="text-2xl font-bold text-[var(--text)]">Connect wallet to view your $FDN</div>
            <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
              Track allocation posture from the same public route before switching into the app shell.
            </p>
          </div>
          <Button variant="brand" size="lg" className="min-w-[220px]" onClick={props.onConnectWallet}>
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="buy-page-panel">
        <CardHeader>
          <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--accent-strong)] uppercase">
            My Portfolio
          </CardTitle>
          <CardDescription>Preview panel - use the app route for live holdings and execution history.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MetricBlock
            label="Total $FDN"
            value={`${formatPlainNumber(PORTFOLIO_METRICS.tokens, 0)} tokens`}
          />
          <MetricBlock
            label="Invested"
            value={formatCurrency(PORTFOLIO_METRICS.investedUsd, 0)}
            note="3 transactions"
          />
          <MetricBlock
            label="At Listing"
            value={formatCurrency(PORTFOLIO_METRICS.listingValueUsd, 0)}
            note={`+${PORTFOLIO_METRICS.roiPercent}% ROI`}
            accent="green"
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="buy-page-panel">
          <CardHeader>
            <CardTitle>Holdings Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PORTFOLIO_HOLDINGS.map(item => (
              <div
                key={item.label}
                className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{item.label}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{item.note}</div>
                  </div>
                  <div className="font-data text-lg font-semibold text-[var(--accent-strong)]">
                    {formatPlainNumber(item.tokens, 0)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="buy-page-panel">
          <CardHeader>
            <CardTitle>Launch Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PortfolioChecklistItem
              title="Presale confirmed"
              description="Allocation overview aligned with listing-reference framing."
            />
            <PortfolioChecklistItem
              title="Referral bonuses applied"
              description="Bonus allocation represented in the portfolio split."
            />
            <PortfolioChecklistItem
              title="Staking queue prepared"
              description="Buy & Stake mode represented in the outlook panel."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function LeadersTabContent() {
  return (
    <Card className="buy-page-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Trophy aria-hidden="true" className="h-5 w-5 text-[var(--accent-strong)]" />
          Top Buyers
        </CardTitle>
        <CardDescription>
          Preview leaderboard for public momentum framing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[560px] rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)]">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--card-border)] hover:bg-transparent">
                <TableHead className="text-[var(--muted)]">Rank</TableHead>
                <TableHead className="text-[var(--muted)]">Wallet</TableHead>
                <TableHead className="text-[var(--muted)]">Tier</TableHead>
                <TableHead className="text-right text-[var(--muted)]">Allocation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {LEADERBOARD.map(entry => (
                <TableRow key={entry.rank} className="border-[var(--card-border)] hover:bg-[color-mix(in_srgb,var(--accent-strong)_5%,transparent)]">
                  <TableCell className="font-data text-[var(--accent-strong)]">#{entry.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-strong)_8%,transparent)]">
                        <AvatarFallback className="bg-transparent text-xs font-bold text-[var(--accent-strong)]">
                          {entry.alias.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-data text-sm text-[var(--text)]">{entry.wallet}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="subtle">{entry.alias}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-data text-[var(--green)]">
                    {formatCurrency(entry.amountUsd, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function StakingTabContent(props: { stakingApyText: string }) {
  return (
    <Card className="buy-page-panel">
      <CardHeader className="items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-strong)_8%,transparent)] text-[var(--accent-strong)]">
          <Lock aria-hidden="true" className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl">Staking Coming Soon</CardTitle>
        <CardDescription className="max-w-2xl">
          Stake $FDN to earn protocol fee share across supported market surfaces. Use the app route when staking
          execution is enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <MetricBlock label="Est. APY (Y1)" value={props.stakingApyText} accent="green" />
        <MetricBlock label="Fee Share" value="40%" accent="green" />
        <MetricBlock label="Rewards" value="Weekly" />
      </CardContent>
    </Card>
  );
}

export function ReferralsTabContent(props: {
  referralLink: string;
  onCopyReferral: () => void;
}) {
  return (
    <Card className="buy-page-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Sparkles aria-hidden="true" className="h-5 w-5 text-[var(--accent-strong)]" />
          Refer & Earn
        </CardTitle>
        <CardDescription>
          Referral performance on this tab is preview-only. Use the app route for live referral accounting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1 rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] px-4 py-4 font-data text-base text-[var(--accent-strong)]">
            {props.referralLink}
          </div>
          <Button variant="brand" size="lg" className="min-w-[180px]" onClick={props.onCopyReferral}>
            <Copy aria-hidden="true" className="h-4 w-4" />
            Copy Link
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricBlock label="Referrals" value="0" />
          <MetricBlock label="Bonus Earned" value="0 $FDN" />
          <MetricBlock label="Volume" value="$0" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BuyFooterSection() {
  return (
    <Card className="buy-page-footer border-[var(--card-border)]">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Gem aria-hidden="true" className="h-5 w-5 text-[var(--accent-strong)]" />
            <span className="text-[11px] font-bold tracking-[0.32em] text-[var(--accent-strong)] uppercase">
              Universal Exchange Presale
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
            Built to frame one entry point for crypto, tokenized equities, FX, commodities, ETFs, and broader market
            access as the FlowDex ecosystem expands.
          </p>
        </div>
        <Badge variant="success" className="self-start md:self-center">
          500+ assets ahead
        </Badge>
      </CardContent>
    </Card>
  );
}

function MetricDisplay(props: {
  label: string;
  value: string;
  accent?: 'cyan' | 'green';
}) {
  return (
    <div className="space-y-1 rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_34%,var(--card-bg))] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        {props.label}
      </div>
      <div
        className={`font-data text-lg font-bold ${props.accent === 'cyan'
            ? 'text-[var(--accent-strong)]'
            : props.accent === 'green'
              ? 'text-[var(--green)]'
              : 'text-[var(--text)]'
          }`}
      >
        {props.value}
      </div>
    </div>
  );
}

function MetricBlock(props: {
  label: string;
  value: string;
  note?: string;
  accent?: 'cyan' | 'green';
  compact?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_32%,var(--card-bg))] p-5">
      <div className="text-[11px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div
        className={`mt-3 font-data font-bold ${props.compact ? 'text-3xl md:text-4xl' : 'text-3xl'
          } ${props.accent === 'cyan'
            ? 'text-[var(--accent-strong)]'
            : props.accent === 'green'
              ? 'text-[var(--green)]'
              : 'text-[var(--text)]'
          }`}
      >
        {props.value}
      </div>
      {props.note ? (
        <div className={`mt-3 text-sm ${props.accent === 'green' ? 'text-[var(--green)]' : 'text-[var(--muted)]'}`}>
          {props.note}
        </div>
      ) : null}
    </div>
  );
}

function StepCard(props: {
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)] text-[var(--accent-strong)]">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-[0.28em] text-[var(--accent-strong)] uppercase">
            Step {props.step}
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--text)]">{props.title}</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-[var(--muted)]">{props.description}</div>
    </div>
  );
}

function StepTile(props: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)] text-[var(--accent-strong)]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-bold text-[var(--text)]">{props.title}</div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{props.description}</p>
    </div>
  );
}

function SummaryRow(props: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[var(--muted)]">{props.label}</span>
      <span className="font-semibold text-[var(--text)]">{props.value}</span>
    </div>
  );
}

function MiniStat(props: {
  label: string;
  value: string;
  accent?: 'green';
}) {
  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-4">
      <div className="text-[11px] font-bold tracking-[0.26em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className={`font-data mt-3 text-2xl font-bold ${props.accent === 'green' ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
        {props.value}
      </div>
    </div>
  );
}

function PortfolioChecklistItem(props: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full border border-[color-mix(in_srgb,var(--green)_30%,transparent)] bg-[color-mix(in_srgb,var(--green)_12%,transparent)] p-1 text-[var(--green)]">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">{props.title}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">{props.description}</div>
        </div>
      </div>
    </div>
  );
}
