'use client';

import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { usePaymentBuyConfig } from '@/dal/app/payments/payments.services';
import { ROUTES } from '@/routes';
import { marketingShellBanner } from './marketing-data';

function formatRaised(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function MarketingStatusBanner() {
  const pathname = usePathname();
  const isBuyPage = pathname === ROUTES.MARKETING.BUY;
  const buyConfig = usePaymentBuyConfig(isBuyPage);
  const stats = isBuyPage
    ? buyConfig.data
      ? [
          { label: '$FDN Price', value: `$${buyConfig.data.presale.tokenPriceUsd}` },
          { label: 'Raised', value: formatRaised(buyConfig.data.presale.fundsRaisedUsd) },
          { label: 'Current Tier', value: String(buyConfig.data.presale.currentTier) },
        ]
      : []
    : marketingShellBanner.stats;

  return (
    <div className="border-b border-[var(--accent-border)] bg-[var(--accent-bg)] backdrop-blur-xl">
      <div className="section-shell flex min-h-9 items-center justify-center gap-x-6 gap-y-2 py-2 text-[11px] font-medium text-[var(--muted)] max-lg:flex-wrap">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Badge
            variant={isBuyPage && buyConfig.isError ? 'subtle' : 'success'}
            className={isBuyPage && buyConfig.isError ? 'gap-2 text-[var(--status-error-text)]' : 'gap-2'}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            {isBuyPage
              ? buyConfig.isLoading
                ? 'Loading live presale data'
                : buyConfig.isError
                  ? 'Live presale data unavailable'
                  : marketingShellBanner.status
              : marketingShellBanner.status}
          </Badge>
          {stats.map(stat => (
            <span key={stat.label} className="hidden sm:inline">
              {stat.label}: <span className={`font-data font-bold ${stat.label === 'Current Tier' ? 'text-[var(--accent-strong)]' : 'text-[var(--text)]'}`}>{stat.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
