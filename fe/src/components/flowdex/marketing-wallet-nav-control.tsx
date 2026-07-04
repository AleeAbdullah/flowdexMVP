'use client';

import { useQueryState } from 'nuqs';
import { formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaymentPortfolio } from '@/dal/app/payments/payments.services';
import { Loader2, LogOut, Wallet } from '@/icons';
import { WalletConnectorIcon } from './wallet-connector-icon';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import { cn } from '@/lib/utils';
import { buyTabParser } from '@/app/(marketing)/buy/constants/buy-tab-parsers';

function getConnectorLabel(connectorName: string) {
  switch (connectorName) {
    case 'metamask':
      return 'MetaMask';
    case 'coinbasewallet':
      return 'Coinbase Wallet';
    case 'walletconnect':
      return 'WalletConnect';
    default:
      return connectorName;
  }
}

export function MarketingWalletNavControl(props: {
  onMobileNavigate?: () => void;
}) {
  const marketingWallet = useMarketingWalletSync();
  const provider = useMarketingWalletStore(state => state.provider);
  const address = provider.address;
  const portfolioQuery = usePaymentPortfolio(address);
  const [, setTab] = useQueryState('tab', buyTabParser);
  const isConnecting = provider.status === 'checking' || Boolean(provider.pendingConnectorName);

  function selectConnector(connectorName: string) {
    marketingWallet.connectByName(connectorName);
  }

  function openPortfolio() {
    void setTab('portfolio');
    props.onMobileNavigate?.();
  }

  function disconnectWallet() {
    void marketingWallet.disconnectWallet();
    props.onMobileNavigate?.();
  }

  if (!address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="brand" size="sm" className="w-full sm:w-auto">
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            Connect Wallet
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 border-(--accent-border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_92%,var(--accent-bg)),color-mix(in_srgb,var(--card-bg-strong)_88%,var(--accent-bg)))] p-2 text-(--text) shadow-[0_28px_90px_color-mix(in_srgb,var(--accent-strong)_26%,rgba(15,23,42,0.18))] ring-1 ring-(--accent-border)"
        >
          <div className="px-3 py-2 text-[10px] font-bold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Connect wallet
          </div>
          {marketingWallet.availableConnectorNames.length > 0 ? (
            marketingWallet.availableConnectorNames.map(connectorName => (
              <DropdownMenuItem
                key={connectorName}
                disabled={isConnecting}
                onSelect={() => selectConnector(connectorName)}
                className="cursor-pointer px-3 py-3 font-semibold"
              >
                <WalletConnectorIcon connectorName={connectorName} className="h-4 w-4" size={16} />
                {getConnectorLabel(connectorName)}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-3 text-sm leading-5 text-amber-100">
              No supported wallet connectors are available in this browser.
            </div>
          )}
          {provider.connectionErrorMessage ? (
            <div className="mt-2 rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-100">
              {provider.connectionErrorMessage}
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const tokenBalance = portfolioQuery.data?.summary.confirmedTokenAmount;
  const balanceLabel = tokenBalance
    ? `${formatPlainNumber(tokenBalance, 0)} $FDN`
    : portfolioQuery.isLoading
      ? 'Loading...'
      : '- $FDN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="glass"
          size="sm"
          className="h-11 w-full justify-center rounded-full border-(--accent-border) bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-bg))] px-4 font-data text-(--accent-strong) shadow-[0_12px_40px_color-mix(in_srgb,var(--accent-shadow)_36%,transparent)] hover:border-(--accent-strong) hover:bg-(--accent-bg) hover:text-(--accent-strong) sm:w-auto"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-(--green) shadow-[0_0_14px_color-mix(in_srgb,var(--green)_60%,transparent)]" />
          {truncateMiddle(address, 6, 4)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-84 overflow-hidden border-(--accent-border) bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_92%,var(--accent-bg)),color-mix(in_srgb,var(--card-bg-strong)_88%,var(--accent-bg)))] p-0 text-(--text) shadow-[0_28px_90px_color-mix(in_srgb,var(--accent-strong)_26%,rgba(15,23,42,0.18))] ring-1 ring-(--accent-border)"
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
              Wallet
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--green)_32%,transparent)] bg-[color-mix(in_srgb,var(--green)_10%,transparent)] px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-(--green) uppercase">
              <span className="h-2 w-2 rounded-full bg-(--green)" />
              Connected
            </div>
          </div>
          <div className="mt-3 font-data text-lg font-bold text-(--text)">
            {truncateMiddle(address, 6, 4)}
          </div>
        </div>

        <div className="border-y border-(--accent-border) bg-(--accent-bg) px-5 py-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Balance
          </div>
          <div className={cn('mt-3 font-data text-lg font-bold text-(--text)', portfolioQuery.isLoading && 'flex items-center gap-2')}>
            {portfolioQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {balanceLabel}
          </div>
        </div>

        <div className="p-3">
          <DropdownMenuItem onSelect={openPortfolio} className="cursor-pointer px-4 py-4 text-base font-semibold">
            <Wallet className="h-5 w-5 text-[color-mix(in_srgb,var(--text)_82%,transparent)]" />
            Portfolio
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={marketingWallet.isDisconnecting}
            onSelect={disconnectWallet}
            className="cursor-pointer px-4 py-4 text-base font-semibold"
          >
            {marketingWallet.isDisconnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5 text-[color-mix(in_srgb,var(--text)_82%,transparent)]" />}
            Disconnect
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
