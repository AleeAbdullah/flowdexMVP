'use client';

import { useEffect, useState } from 'react';
import { DataKicker, StatusPill } from '@/components/flowdex/primitives';
import { formatCurrency, formatDateTime, formatPlainNumber, truncateMiddle } from '@/components/flowdex/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePaymentPortfolio } from '@/dal/app/payments/payments.services';
import type { IPaymentPortfolioTransaction } from '@/dal/app/payments/payments.types';
import { Loader2, ReceiptText, Search, Wallet } from '@/icons';
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
            Confirmed presale allocation and payment activity for a wallet.
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
