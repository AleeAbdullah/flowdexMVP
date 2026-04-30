import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CircleAlert, Send } from '@/icons';
import {
  marketingShellBanner,
  marketingShellFooter,
  marketingSocialCards,
} from './marketing-data';
import { MarketingNav } from './marketing-nav';
import { FlowdexWordmark } from './primitives';

export async function MarketingShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,color-mix(in_srgb,var(--accent-strong)_18%,transparent),transparent_24%),radial-gradient(circle_at_78%_8%,color-mix(in_srgb,var(--accent-soft)_14%,transparent),transparent_22%)]" />

      <a
        href="#marketing-content"
        className="absolute left-4 top-4 z-[70] rounded-full border border-[var(--accent-border)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text)] opacity-0 shadow-lg transition-[opacity,transform] duration-150 focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="border-b border-[var(--accent-border)] bg-[var(--accent-bg)] backdrop-blur-xl">
          <div className="section-shell flex min-h-9 items-center justify-center gap-x-6 gap-y-2 py-2 text-[11px] font-medium text-[var(--muted)] max-lg:flex-wrap">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Badge variant="success" className="gap-2 text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green)] shadow-[0_0_14px_var(--green)]" />
                {marketingShellBanner.status}
              </Badge>
              {marketingShellBanner.stats.map(stat => (
                <span key={stat.label}>
                  {stat.label}: <span className={`font-data font-bold ${stat.label === 'Current Tier' ? 'text-[var(--accent-strong)]' : 'text-[var(--text)]'}`}>{stat.value}</span>
                </span>
              ))}
            </div>
            <div className="inline-flex items-center gap-2 font-semibold text-[var(--accent-strong)]">
              <Send aria-hidden="true" className="h-3.5 w-3.5" />
              Telegram Coming Soon
            </div>
          </div>
        </div>
        <MarketingNav />
      </header>

      <main id="marketing-content" tabIndex={-1} className="pt-40 outline-none md:pt-32">
        {children}
      </main>

      <footer className="border-t border-[var(--card-border)] bg-[image:var(--footer-surface)]">
        <div className="section-shell grid gap-10 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <FlowdexWordmark compact />
            <p className="max-w-sm text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
              {marketingShellFooter.brandBody}
            </p>
          </div>
          {marketingShellFooter.columns.map(column => (
            <FooterColumn key={column.title} title={column.title} items={column.items} />
          ))}
        </div>
        <div className="section-shell pb-6">
          <Alert variant="brand">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>{marketingShellFooter.noticeTitle}</AlertTitle>
            <AlertDescription>
              {marketingShellFooter.noticeBody}
            </AlertDescription>
          </Alert>
        </div>
        <Separator className="bg-[color-mix(in_srgb,var(--muted)_25%,transparent)]" />
        <div className="section-shell flex flex-col gap-2 py-4 text-xs text-[color-mix(in_srgb,var(--text)_54%,transparent)] md:flex-row md:items-center md:justify-between">
          <span>{marketingShellFooter.legalLine}</span>
          <div className="flex items-center gap-4">
            <span>{marketingShellFooter.utilityLine}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn(props: {
  title: string;
  items: Array<{ label: string; href: string; note?: string }>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_50%,transparent)] uppercase">
        {props.title}
      </div>
      <div className="space-y-3">
        {props.items.map((item) => {
          if (item.note) {
            return (
              <div
                key={item.label}
                className="space-y-1 text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)]"
              >
                <div>{item.label}</div>
                <div className="text-xs text-[color-mix(in_srgb,var(--text)_48%,transparent)]">{item.note}</div>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="block text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)] hover:text-[var(--accent-strong)]"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
