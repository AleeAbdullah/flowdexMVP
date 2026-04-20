'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  formatPlainNumber,
  parseDecimal,
} from './utils';

const PRESALE = {
  currentTier: 1,
  raisedUsd: 1_850_000,
  targetUsd: 5_000_000,
  tokenPriceUsd: 0.001,
  listingPriceUsd: 0.05,
  discountPercent: 98,
  fillPercent: 36.9,
  stakingApy: '12-18%',
  vesting: [
    { label: '5% TGE', share: 12 },
    { label: '12mo cliff', share: 23 },
    { label: '24mo vest', share: 42 },
    { label: 'Full unlock 36 months', share: 23 },
  ],
} as const;

const ASSET_SHOWCASE = [
  'Bitcoin',
  'Ethereum',
  'Tesla',
  'Apple',
  'Gold',
  'EUR/USD',
  'S&P 500',
  'Oil',
  'Nvidia',
  'ETFs',
  '500+ more',
];

const PAYMENT_ASSETS = [
  { code: 'ETH', label: 'Ethereum', usdPrice: 2850, symbol: 'ETH' },
  { code: 'USDT', label: 'Tether', usdPrice: 1, symbol: 'USDT' },
  { code: 'USDC', label: 'USD Coin', usdPrice: 1, symbol: 'USDC' },
  { code: 'BNB', label: 'BNB', usdPrice: 610, symbol: 'BNB' },
  { code: 'SOL', label: 'Solana', usdPrice: 190, symbol: 'SOL' },
] as const;

const QUICK_BUY_AMOUNTS = [100, 500, 1000, 5000];

const SCENARIOS = [
  { label: 'Listing', multiplier: 50 },
  { label: '5x', multiplier: 250 },
  { label: '10x', multiplier: 500 },
  { label: '50x', multiplier: 2500 },
];

const LIVE_ACTIVITY = [
  { wallet: '0x6086...ae434', asset: 'ETH', amountUsd: 8859, volume: '8.86M' },
  { wallet: '0x930f...a918B', asset: 'USDT', amountUsd: 5554, volume: '5.55M' },
  { wallet: '0x930f...a918B', asset: 'SOL', amountUsd: 8631, volume: '8.63M' },
];

const LEADERBOARD = [
  { rank: 1, alias: 'Whale', wallet: '0xD91c...eC34a', amountUsd: 48500 },
  { rank: 2, alias: 'Shark', wallet: '0x82bC...43e5C', amountUsd: 36200 },
  { rank: 3, alias: 'Shark', wallet: '0xAa19...d92F1', amountUsd: 27800 },
  { rank: 4, alias: 'Dolphin', wallet: '0x4b2A...7F12B', amountUsd: 22100 },
  { rank: 5, alias: 'Dolphin', wallet: '0xe8Dc...2239a', amountUsd: 18400 },
  { rank: 6, alias: 'Fish', wallet: '0x3fE7...1bA08', amountUsd: 14200 },
  { rank: 7, alias: 'Fish', wallet: '0x930f...a918B', amountUsd: 10800 },
  { rank: 8, alias: 'Fish', wallet: '0x6086...ae434', amountUsd: 9200 },
];

const PORTFOLIO_METRICS = {
  tokens: 320_832,
  investedUsd: 9625,
  listingValueUsd: 16_042,
  roiPercent: 66.7,
};

const PORTFOLIO_HOLDINGS = [
  { label: 'Presale Allocation', tokens: 210_000, note: 'Tier 1 locked' },
  { label: 'Bonus Tokens', tokens: 10_832, note: 'Referral rewards' },
  { label: 'Staking Queue', tokens: 100_000, note: 'Ready on launch' },
];

const REFERRAL_LINK = 'flowdex.network/buy?ref=FDX-A3B7K9';
const BUY_TABS = [
  { value: 'buy', label: 'Buy $FDN' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'leaders', label: 'Leaders' },
  { value: 'staking', label: 'Staking' },
  { value: 'referrals', label: 'Referrals' },
] as const;

export function BuyPage(props: { isAuthenticated: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('buy');
  const [walletConnected, setWalletConnected] = useState(false);
  const [orderMode, setOrderMode] = useState<string>('buy');
  const [paymentRail, setPaymentRail] = useState<string>('crypto');
  const [selectedAssetCode, setSelectedAssetCode] = useState<string>(PAYMENT_ASSETS[0].code);
  const [customAmount, setCustomAmount] = useState(`${QUICK_BUY_AMOUNTS[0]}`);

  const selectedAsset = PAYMENT_ASSETS.find(asset => asset.code === selectedAssetCode) ?? PAYMENT_ASSETS[0];
  const amountUsd = parseDecimal(customAmount);
  const estimatedTokens = amountUsd > 0 ? amountUsd / PRESALE.tokenPriceUsd : 0;
  const assetUnits = selectedAsset.usdPrice > 0 ? amountUsd / selectedAsset.usdPrice : 0;
  const stakeBoostTokens = orderMode === 'stake' ? estimatedTokens * 0.15 : 0;
  const listingValue = estimatedTokens * PRESALE.listingPriceUsd;
  const raisedProgress = (PRESALE.raisedUsd / PRESALE.targetUsd) * 100;
  const activeQuickAmount = QUICK_BUY_AMOUNTS.find(value => value === amountUsd)?.toString() ?? '';

  const handleConnectWallet = () => {
    if (!props.isAuthenticated) {
      router.push('/login');
      return;
    }

    setWalletConnected(true);
    toast.success('Wallet connected');
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
  };

  const handlePrimaryAction = () => {
    if (!props.isAuthenticated) {
      handleConnectWallet();
      return;
    }

    if (!walletConnected) {
      handleConnectWallet();
      return;
    }

    toast.success(orderMode === 'stake' ? 'Buy & stake flow ready' : 'Buy flow ready');
  };

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      toast.success('Referral link copied');
    } catch {
      toast.success(`Referral link: ${REFERRAL_LINK}`);
    }
  };

  return (
    <TooltipProvider delayDuration={120}>
      <div className="section-shell section-pad space-y-6 md:space-y-8">
        <Card className="buy-page-hero overflow-hidden border-[color-mix(in_srgb,var(--cyan)_20%,var(--card-border))]">
          <CardContent className="space-y-6 p-5 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="brand" className="gap-2 text-[var(--cyan)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--green)] shadow-[0_0_12px_var(--green)]" />
                    Tier {PRESALE.currentTier} Live
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-1 text-[10px] font-bold tracking-[0.24em] uppercase text-[color-mix(in_srgb,var(--text)_72%,transparent)]"
                      >
                        <Info className="h-3.5 w-3.5" />
                        sample allocation
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="border-[var(--card-border)] bg-[var(--bg-2)] text-[var(--text)]">
                      Portfolio, leaderboard, staking, and referral values are shown as launch-page samples.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <h1 className="font-heading text-3xl font-black tracking-tight text-[var(--text)] md:text-5xl">
                    Buy into the presale dashboard, not a placeholder landing page.
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)] md:text-base">
                    A sharper public buy experience with clearer hierarchy, stronger contrast, and a product-like
                    tabbed surface for demand, referrals, staking, and leaderboard framing.
                  </p>
                </div>
              </div>

              <Button
                variant={walletConnected ? 'glass' : 'brand'}
                size="lg"
                className="min-w-[220px] self-start"
                onClick={walletConnected ? handleDisconnectWallet : handleConnectWallet}
              >
                {walletConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </Button>
            </div>

            <div className="buy-page-stage rounded-[1.5rem] border border-[color-mix(in_srgb,var(--cyan)_14%,var(--card-border))] p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
                    Tier 1 - Live
                  </div>
                  <div className="text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                    {formatCurrency(PRESALE.raisedUsd, 2)} / {formatCurrency(PRESALE.targetUsd, 2)} raised
                  </div>
                </div>
                <div className="text-sm font-semibold text-[color-mix(in_srgb,var(--text)_70%,transparent)]">
                  {PRESALE.fillPercent}% filled
                </div>
              </div>

              <Progress
                value={raisedProgress}
                className="mt-4 h-3 bg-[color-mix(in_srgb,var(--bg)_45%,var(--card-bg))]"
              />

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <MetricDisplay label="Price" value={formatCurrency(PRESALE.tokenPriceUsd, 3)} accent="cyan" />
                <MetricDisplay label="Discount" value={`-${PRESALE.discountPercent}%`} accent="green" />
                <MetricDisplay label="Listing" value={formatCurrency(PRESALE.listingPriceUsd, 2)} />
                <MetricDisplay label="Filled" value={formatPercent(PRESALE.fillPercent)} />
              </div>

              <div className="mt-5 space-y-2">
                <div className="text-[11px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
                  Tier 1 Vesting
                </div>
                <div className="grid overflow-hidden rounded-full border border-[var(--card-border)] bg-[var(--bg)] md:grid-cols-4">
                  {PRESALE.vesting.map(item => (
                    <div
                      key={item.label}
                      className="flex min-h-12 items-center justify-center border-b border-[var(--card-border)] px-3 text-center text-[11px] font-semibold text-[color-mix(in_srgb,var(--text)_74%,transparent)] last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="buy-page-panel-soft">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:p-6">
              <MetricBlock label="Current Price" value={formatCurrency(PRESALE.tokenPriceUsd, 3)} accent="cyan" />
              <MetricBlock label="Listing Price" value={formatCurrency(PRESALE.listingPriceUsd, 2)} />
              <MetricBlock label="Discount" value={`${PRESALE.discountPercent}%`} accent="green" compact />
            </CardContent>
          </Card>

          <Card className="buy-page-panel-soft">
            <CardHeader className="pb-4">
              <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--cyan)] uppercase">
                How To Buy
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pb-5 md:grid-cols-3">
              <StepCard icon={Wallet} step="1" title="Choose payment" description="Crypto or card" />
              <StepCard icon={Banknote} step="2" title="Enter amount" description="Quick-buy or custom" />
              <StepCard icon={CheckCircle2} step="3" title="Confirm" description="Tokens in 30 min" />
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <div className="overflow-x-auto rounded-[1.25rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_65%,transparent)]">
            <TabsList className="h-auto min-w-full justify-start gap-2 rounded-[1.25rem] bg-transparent p-2">
              {BUY_TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-w-[132px] rounded-[1rem] border border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] data-[state=active]:border-[var(--cyan)] data-[state=active]:bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--cyan)_40%,transparent)]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="buy" className="space-y-5">
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
                  <MiniStat label="Price" value={formatCurrency(PRESALE.tokenPriceUsd, 3)} />
                  <MiniStat label="Listing" value={formatCurrency(PRESALE.listingPriceUsd, 2)} />
                  <MiniStat label="Discount" value={`-${PRESALE.discountPercent}%`} accent="green" />
                  <MiniStat label="Staking APY" value={PRESALE.stakingApy} accent="green" />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="buy-page-panel">
                <CardContent className="space-y-6 p-5 md:p-6">
                  <ToggleGroup
                    type="single"
                    value={orderMode}
                    onValueChange={(value) => value && setOrderMode(value)}
                    className="grid w-full grid-cols-2 gap-3"
                  >
                    <ToggleGroupItem
                      value="buy"
                      variant="outline"
                      className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--accent-bg)] font-semibold text-[var(--text)] data-[state=on]:border-[var(--cyan)] data-[state=on]:bg-[linear-gradient(135deg,#69D3F2,#43B8E3)] data-[state=on]:text-[#04111d]"
                    >
                      Buy $FDN
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="stake"
                      variant="outline"
                      className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] font-semibold text-[var(--text)] data-[state=on]:border-[var(--cyan)] data-[state=on]:bg-[linear-gradient(135deg,#69D3F2,#43B8E3)] data-[state=on]:text-[#04111d]"
                    >
                      Buy & Stake (≈15% APY)
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
                      Payment Method
                    </Label>
                    <ToggleGroup
                      type="single"
                      value={paymentRail}
                      onValueChange={(value) => value && setPaymentRail(value)}
                      className="grid w-full grid-cols-2 gap-3"
                    >
                      <ToggleGroupItem
                        value="crypto"
                        variant="outline"
                        className="h-16 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] text-base font-semibold text-[var(--text)] data-[state=on]:border-[var(--cyan)] data-[state=on]:bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)]"
                      >
                        <Wallet className="h-4 w-4" />
                        Crypto
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="card"
                        variant="outline"
                        className="h-16 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] text-base font-semibold text-[var(--text)] data-[state=on]:border-[var(--cyan)] data-[state=on]:bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)]"
                      >
                        <CreditCard className="h-4 w-4" />
                        Card
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-[var(--text)]">Select Currency</Label>
                      <Select value={selectedAssetCode} onValueChange={setSelectedAssetCode}>
                        <SelectTrigger className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
                          <SelectValue placeholder="Choose a currency" />
                        </SelectTrigger>
                        <SelectContent className="border-[var(--card-border)] bg-[var(--bg-2)] text-[var(--text)]">
                          {PAYMENT_ASSETS.map(asset => (
                            <SelectItem key={asset.code} value={asset.code}>
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
                        value={activeQuickAmount}
                        onValueChange={(value) => value && setCustomAmount(value)}
                        className="grid grid-cols-2 gap-3"
                      >
                        {QUICK_BUY_AMOUNTS.map(amount => (
                          <ToggleGroupItem
                            key={amount}
                            value={`${amount}`}
                            variant="outline"
                            className="h-14 rounded-[1rem] border-[var(--card-border)] bg-[var(--card-bg)] font-semibold text-[var(--text)] data-[state=on]:border-[var(--cyan)] data-[state=on]:bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)]"
                          >
                            ${formatPlainNumber(amount, 0)}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-[var(--text)]">Custom Amount</Label>
                    <div className="rounded-[1.2rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_42%,var(--card-bg))] p-3">
                      <Input
                        value={customAmount}
                        onChange={event => setCustomAmount(event.target.value)}
                        inputMode="decimal"
                        className="h-16 border-0 bg-transparent px-2 text-4xl font-semibold tracking-tight shadow-none ring-0 focus-visible:ring-0"
                      />
                      <div className="flex items-center justify-between px-2 pb-1 text-sm text-[var(--muted)]">
                        <span>≈ {formatPlainNumber(assetUnits, 4)} {selectedAsset.symbol}</span>
                        <span>{selectedAsset.code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-[color-mix(in_srgb,var(--cyan)_20%,var(--card-border))] bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)]">
                      <CardContent className="space-y-2 p-5">
                        <div className="text-[11px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">
                          You Receive
                        </div>
                        <div className="font-data text-3xl font-bold text-[var(--text)]">
                          {formatCompact(estimatedTokens + stakeBoostTokens, 2)} $FDN
                        </div>
                        <div className="text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                          {orderMode === 'stake'
                            ? `${formatCompact(stakeBoostTokens, 2)} token bonus preview`
                            : `${formatCurrency(listingValue, 0)} listing value at launch framing`}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-[var(--card-border)] bg-[var(--card-bg)]">
                      <CardContent className="space-y-3 p-5">
                        <div className="text-[11px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_58%,transparent)] uppercase">
                          Buy Summary
                        </div>
                        <SummaryRow label="Payment rail" value={paymentRail === 'crypto' ? 'Crypto' : 'Card'} />
                        <SummaryRow label="Settlement asset" value={selectedAsset.code} />
                        <SummaryRow label="Presale price" value={formatCurrency(PRESALE.tokenPriceUsd, 3)} />
                        <SummaryRow label="Listing target" value={formatCurrency(PRESALE.listingPriceUsd, 2)} />
                      </CardContent>
                    </Card>
                  </div>

                  <Button variant="brand" size="lg" className="h-14 w-full text-base" onClick={handlePrimaryAction}>
                    {walletConnected
                      ? orderMode === 'stake'
                        ? 'Preview Static Buy & Stake'
                        : 'Preview Static Buy'
                      : 'Connect Wallet to Buy'}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card className="buy-page-panel">
                  <CardHeader>
                    <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--cyan)] uppercase">
                      Market Cap Scenarios
                    </CardTitle>
                    <CardDescription>
                      What your $FDN could be worth at different market-cap narratives based on the amount above.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {SCENARIOS.map(scenario => {
                      const price = PRESALE.tokenPriceUsd * scenario.multiplier;
                      const value = estimatedTokens * price;

                      return (
                        <Card key={scenario.label} className="border-[var(--card-border)] bg-[var(--bg-2)] shadow-none hover:translate-y-0">
                          <CardContent className="space-y-2 p-4">
                            <div className="font-data text-2xl font-bold text-[var(--cyan)]">{scenario.label}</div>
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
                    <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--cyan)] uppercase">
                      Live Activity
                    </CardTitle>
                    <CardDescription>Static tape for the leaderboard and social proof panel.</CardDescription>
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
                        <div className="text-sm font-semibold text-[var(--cyan)]">{entry.asset}</div>
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
                    <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--cyan)] uppercase">
                      How To Buy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <StepTile
                      icon={Wallet}
                      title="Connect Wallet"
                      description="MetaMask, Trust Wallet, Coinbase, or Phantom. Or pay by card."
                    />
                    <StepTile
                      icon={Coins}
                      title="Choose Amount"
                      description="Pick a quick preset ($100-$5K) or enter a custom amount."
                    />
                    <StepTile
                      icon={CheckCircle2}
                      title="Confirm & Receive"
                      description="Send crypto or pay by card. Tokens allocated in 30 minutes."
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-5">
            {!walletConnected ? (
              <Card className="buy-page-panel">
                <CardHeader>
                  <CardTitle>My Portfolio</CardTitle>
                  <CardDescription>Connect your wallet to view your $FDN portfolio snapshot.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
                  <Wallet className="h-14 w-14 text-[var(--cyan)]" />
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-[var(--text)]">Connect wallet to view your $FDN</div>
                    <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
                      Track your allocation, listing value, and reward posture from the same dashboard.
                    </p>
                  </div>
                  <Button variant="brand" size="lg" className="min-w-[220px]" onClick={handleConnectWallet}>
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="buy-page-panel">
                  <CardHeader>
                    <CardTitle className="text-[11px] tracking-[0.32em] text-[var(--cyan)] uppercase">
                      My Portfolio
                    </CardTitle>
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
                            <div className="font-data text-lg font-semibold text-[var(--cyan)]">
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
                        description="Allocation overview aligned with listing-price framing."
                      />
                      <PortfolioChecklistItem
                        title="Referral bonuses applied"
                        description="Bonus allocation already represented in the portfolio split."
                      />
                      <PortfolioChecklistItem
                        title="Staking queue prepared"
                        description="Buy & Stake mode is already represented in the portfolio outlook."
                      />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="leaders">
            <Card className="buy-page-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-[var(--cyan)]" />
                  Top Buyers
                </CardTitle>
                <CardDescription>
                  A ranked buyer board that adds momentum and social proof to the presale surface.
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
                        <TableRow key={entry.rank} className="border-[var(--card-border)] hover:bg-[color-mix(in_srgb,var(--cyan)_5%,transparent)]">
                          <TableCell className="font-data text-[var(--cyan)]">#{entry.rank}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--cyan)_8%,transparent)]">
                                <AvatarFallback className="bg-transparent text-xs font-bold text-[var(--cyan)]">
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
          </TabsContent>

          <TabsContent value="staking">
            <Card className="buy-page-panel">
              <CardHeader className="items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--cyan)_8%,transparent)] text-[var(--cyan)]">
                  <Lock className="h-8 w-8" />
                </div>
                <CardTitle className="text-3xl">Staking Coming Soon</CardTitle>
                <CardDescription className="max-w-2xl">
                  Stake $FDN to earn protocol fee share from crypto, stocks, forex, commodities, and more.
                  Governance routing priority is part of the broader staking product direction.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <MetricBlock label="Est. APY (Y1)" value={PRESALE.stakingApy} accent="green" />
                <MetricBlock label="Fee Share" value="40%" accent="green" />
                <MetricBlock label="Rewards" value="Weekly" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card className="buy-page-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--cyan)]" />
                  Refer & Earn
                </CardTitle>
                <CardDescription>
                  Earn 5% bonus on every referral. Share your link and keep the social loop on the same page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="flex-1 rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] px-4 py-4 font-data text-base text-[var(--cyan)]">
                    {REFERRAL_LINK}
                  </div>
                  <Button variant="brand" size="lg" className="min-w-[180px]" onClick={handleCopyReferral}>
                    <Copy className="h-4 w-4" />
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
          </TabsContent>
        </Tabs>

        <Card className="buy-page-footer border-[var(--card-border)]">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-[var(--cyan)]" />
                <span className="text-[11px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
                  Universal Exchange Presale
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                Built to frame one entry point for crypto, tokenized equities, FX, commodities, ETFs, and broader
                market access as the FlowDex ecosystem expands.
              </p>
            </div>
            <Badge variant="success" className="self-start md:self-center">
              500+ assets ahead
            </Badge>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
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
            ? 'text-[var(--cyan)]'
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
            ? 'text-[var(--cyan)]'
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
  icon: typeof Wallet;
  step: string;
  title: string;
  description: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)] text-[var(--cyan)]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">
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
  icon: typeof Wallet;
  title: string;
  description: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--bg-2)] p-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)] text-[var(--cyan)]">
        <Icon className="h-5 w-5" />
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
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">{props.title}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">{props.description}</div>
        </div>
      </div>
    </div>
  );
}
