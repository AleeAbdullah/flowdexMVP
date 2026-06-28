'use client';

import { useEffect, useState } from 'react';
import { DataKicker, StatusPill } from '@/components/flowdex/primitives';
import { formatCurrency, formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePaymentPortfolio } from '@/dal/app/payments/payments.services';
import type { IPaymentPortfolioBreakdown, IPaymentPortfolioTransaction } from '@/dal/app/payments/payments.types';
import { Loader2, Lock, ReceiptText, Search, Wallet } from '@/icons';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { cn } from '@/lib/utils';
import type { BuyMarketView } from '../types/buy-view-model';
import { formatPaymentAmount, getChainLabel } from '../utils/buy-display';

export function PortfolioPanel(props: {
  market: BuyMarketView;
}) {
  const verifiedWalletAddress = useMarketingWalletStore(state =>
    state.verification.status === 'verified' ? state.verification.walletAddress : null,
  );
  const connectedWalletAddress = useMarketingWalletStore(state => state.provider.address);
  const defaultWalletAddress = verifiedWalletAddress ?? connectedWalletAddress;
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [lookupAddress, setLookupAddress] = useState<string | null>(defaultWalletAddress);

  useEffect(() => {
    if (defaultWalletAddress) {
      setLookupAddress(defaultWalletAddress);
      setWalletAddressInput(defaultWalletAddress);
    }
  }, [defaultWalletAddress]);

  const portfolioQuery = usePaymentPortfolio(lookupAddress);
  const portfolio = portfolioQuery.data;
  const confirmedTokenAmount = Number(portfolio?.summary.confirmedTokenAmount ?? 0);
  const currentPresaleValue = confirmedTokenAmount * props.market.tokenPriceUsd;
  const estimatedListingValue = confirmedTokenAmount * props.market.listingReferenceUsd;
  const tgeUnlockAmount = confirmedTokenAmount * 0.05;
  const lockedAmount = Math.max(0, confirmedTokenAmount - tgeUnlockAmount);
  const hasLookupAddress = Boolean(lookupAddress);

  function submitLookup() {
    const nextAddress = walletAddressInput.trim();
    if (nextAddress) {
      setLookupAddress(nextAddress);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Portfolio</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Confirmed presale allocation, payment activity, vesting preview, and future utility status for a wallet.
          </p>
          {lookupAddress ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[#050c16] px-3 py-1.5 font-data text-xs text-[var(--text)]">
              <Wallet className="h-3.5 w-3.5 text-[var(--cyan)]" />
              {truncateMiddle(lookupAddress, 12, 8)}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[28rem]">
          <Input
            value={walletAddressInput}
            onChange={event => setWalletAddressInput(event.target.value)}
            placeholder="Wallet address"
            className="h-11 border-[var(--card-border)] bg-[#050c16] text-[var(--text)]"
          />
          <Button type="button" variant="glass" className="h-11 shrink-0" onClick={submitLookup} disabled={!walletAddressInput.trim()}>
            <Search className="h-4 w-4" />
            Lookup
          </Button>
        </div>
      </div>

      {!hasLookupAddress ? (
        <EmptyPortfolioState />
      ) : null}

      {portfolioQuery.isLoading ? (
        <div className="mt-8 flex items-center gap-3 rounded-md border border-[var(--card-border)] bg-[#050c16] px-4 py-8 text-sm text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cyan)]" />
          Loading portfolio.
        </div>
      ) : null}

      {portfolioQuery.isError ? (
        <div className="mt-8 rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Could not load this portfolio right now.
        </div>
      ) : null}

      {portfolio && portfolio.summary.totalTransactions === 0 ? (
        <div className="mt-8 rounded-md border border-[var(--card-border)] bg-[#050c16] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No presale payments found for this wallet yet.
        </div>
      ) : null}

      {portfolio && portfolio.summary.totalTransactions > 0 ? (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PortfolioMetric label="Invested" value={formatCurrency(portfolio.summary.totalInvestedUsd, 0)} />
            <PortfolioMetric label="Confirmed $FDN" value={`${formatPlainNumber(portfolio.summary.confirmedTokenAmount, 0)} FDN`} accent />
            <PortfolioMetric label="Listing Value" value={formatCurrency(estimatedListingValue, 0)} accent />
            <PortfolioMetric label="Current Value" value={formatCurrency(currentPresaleValue, 0)} />
            <PortfolioMetric label="Transactions" value={String(portfolio.summary.totalTransactions)} note={`${portfolio.summary.confirmedTransactions} confirmed`} />
            <PortfolioMetric label="Avg. Entry" value={formatCurrency(portfolio.summary.averageEntryPriceUsd, 4)} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
            <VestingPreview tgeUnlockAmount={tgeUnlockAmount} lockedAmount={lockedAmount} />
            <PortfolioBreakdowns
              assetBreakdowns={portfolio.breakdowns.byAsset}
              chainBreakdowns={portfolio.breakdowns.byChain}
              statusBreakdowns={portfolio.breakdowns.byStatus}
            />
          </div>

          <PortfolioTransactions transactions={portfolio.transactions} />
        </>
      ) : null}
    </section>
  );
}

function EmptyPortfolioState() {
  return (
    <div className="mt-8 rounded-md border border-[var(--card-border)] bg-[#050c16] px-4 py-8 text-center text-sm text-[var(--muted)]">
      Connect a wallet or enter a wallet address to view its presale portfolio.
    </div>
  );
}

function PortfolioMetric(props: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[0.85rem] border border-[var(--card-border)] bg-[#050c16] px-4 py-5">
      <DataKicker label={props.label} value={props.value} className={cn(props.accent && '[&>div:last-child]:text-emerald-300')} />
      {props.note ? <div className="mt-2 text-xs text-[var(--muted)]">{props.note}</div> : null}
    </div>
  );
}

function VestingPreview(props: {
  tgeUnlockAmount: number;
  lockedAmount: number;
}) {
  return (
    <div className="rounded-[0.85rem] border border-[var(--card-border)] bg-[#050c16] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Vesting Preview</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Claim support will unlock after TGE and Merkle proof publication.</p>
        </div>
        <Lock className="h-5 w-5 text-yellow-200" />
      </div>
      <div className="mt-5 grid h-10 overflow-hidden rounded-sm text-[10px] font-black md:grid-cols-[0.05fr_0.35fr_0.6fr]">
        <div className="flex items-center justify-center bg-[var(--cyan)] text-[#02111c]">5%</div>
        <div className="flex items-center justify-center bg-[#112337] text-[var(--muted)]">12mo Cliff</div>
        <div className="flex items-center justify-center bg-[#0d9cb4] text-[var(--text)]">24mo Vest</div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <DataKicker label="TGE Unlock" value={`${formatPlainNumber(props.tgeUnlockAmount, 0)} FDN`} />
        <DataKicker label="Locked" value={`${formatPlainNumber(props.lockedAmount, 0)} FDN`} />
      </div>
    </div>
  );
}

function PortfolioBreakdowns(props: {
  assetBreakdowns: IPaymentPortfolioBreakdown[];
  chainBreakdowns: IPaymentPortfolioBreakdown[];
  statusBreakdowns: IPaymentPortfolioBreakdown[];
}) {
  return (
    <div className="rounded-[0.85rem] border border-[var(--card-border)] bg-[#050c16] p-5">
      <h2 className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">Breakdown</h2>
      <div className="mt-5 space-y-5">
        <BreakdownGroup title="Confirmed Assets" items={props.assetBreakdowns} emptyLabel="No confirmed assets yet." />
        <BreakdownGroup title="Confirmed Chains" items={props.chainBreakdowns} emptyLabel="No confirmed chains yet." />
        <BreakdownGroup title="Status" items={props.statusBreakdowns} emptyLabel="No activity yet." />
      </div>
    </div>
  );
}

function BreakdownGroup(props: {
  title: string;
  items: IPaymentPortfolioBreakdown[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.24em] text-[var(--muted)] uppercase">{props.title}</div>
      <div className="mt-3 space-y-2">
        {props.items.length === 0 ? <div className="text-xs text-[var(--muted)]">{props.emptyLabel}</div> : null}
        {props.items.map(item => (
          <div key={`${props.title}-${item.key}`} className="flex items-center justify-between gap-4 text-sm">
            <span className="font-bold text-[var(--text)]">{item.key}</span>
            <span className="text-right font-data text-xs text-[var(--muted)]">
              {formatCurrency(item.totalUsd, 0)} / {formatPlainNumber(item.tokenAmount, 0)} FDN
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioTransactions(props: {
  transactions: IPaymentPortfolioTransaction[];
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-[0.85rem] border border-[var(--card-border)]">
      <div className="flex items-center gap-2 bg-[#07111d] px-4 py-3 text-[10px] font-bold tracking-[0.28em] text-[var(--muted)] uppercase">
        <ReceiptText className="h-4 w-4 text-[var(--cyan)]" />
        Payment History
      </div>
      <div className="divide-y divide-[var(--card-border)]">
        {props.transactions.map(transaction => (
          <TransactionRow key={transaction.intentId} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}

function TransactionRow(props: {
  transaction: IPaymentPortfolioTransaction;
}) {
  const transaction = props.transaction;
  const amountBaseUnits = transaction.paidAmountBaseUnits ?? transaction.expectedAmountBaseUnits;
  const status = transaction.paymentStatus ?? transaction.intentStatus;

  return (
    <div className="grid gap-4 px-4 py-5 text-sm xl:grid-cols-[1.1fr_0.85fr_0.8fr_0.8fr_auto] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={status} className="tracking-[0.16em]" />
          <span className="font-data text-xs text-[var(--muted)]">{getChainLabel(transaction.chain)}</span>
        </div>
        <div className="mt-2 truncate font-data text-xs text-[var(--muted)]">
          {transaction.transactionId ? truncateMiddle(transaction.transactionId, 12, 8) : 'No transaction ID yet'}
        </div>
        {transaction.transactionIdKind ? (
          <div className="mt-1 text-[10px] font-bold tracking-[0.18em] text-[var(--muted)] uppercase">
            {transaction.transactionIdKind}
          </div>
        ) : null}
      </div>
      <DataKicker label="Paid" value={formatPaymentAmount(amountBaseUnits, transaction.asset)} />
      <DataKicker label="USD" value={formatCurrency(transaction.usdAmount, 0)} />
      <DataKicker label="$FDN" value={formatPlainNumber(transaction.tokenAmount, 0)} />
      <div className="text-left xl:text-right">
        <div className="text-xs text-[var(--muted)]">{formatDateTime(transaction.confirmedAt ?? transaction.createdAt)}</div>
        <div className="mt-2 text-[10px] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
          {transaction.confirmations} conf.
        </div>
      </div>
    </div>
  );
}
