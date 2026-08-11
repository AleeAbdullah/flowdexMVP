import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CircleAlert, icons } from '@/icons';
import {
  marketingShellFooter,
} from './marketing-data';
import { MarketingNav } from './marketing-nav';
import { FlowdexWordmark } from './primitives';
import { MarketingStatusBanner } from './marketing-status-banner';

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
        <MarketingStatusBanner />
        <MarketingNav />
      </header>

      <main id="marketing-content" tabIndex={-1} className="pt-40 outline-none md:pt-32">
        {children}
      </main>

      <footer className="border-t border-[var(--card-border)] bg-[image:var(--footer-surface)]">
        <div className="section-shell grid gap-10 py-10 md:grid-cols-[1.4fr_repeat(2,minmax(0,1fr))]">
          <div className="space-y-4">
            <FlowdexWordmark compact />
            <p className="max-w-sm text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
              {marketingShellFooter.brandBody}
            </p>
            <div className="flex flex-wrap gap-3">
              {marketingShellFooter.socialLinks.map(item => {
                const Icon = icons[item.icon];

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-semibold text-[color-mix(in_srgb,var(--text)_72%,transparent)] hover:border-[var(--accent-border)] hover:text-[var(--accent-strong)]"
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
          {marketingShellFooter.columns.filter(column => column.items.length > 0).map(column => (
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
  items: Array<{ label: string; href: string; note?: string; newTab?: boolean }>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_50%,transparent)] uppercase">
        {props.title}
      </div>
      <div className="space-y-3">
        {props.items.map(item => (
          <Link
            key={item.label}
            href={item.href}
            target={item.newTab ? '_blank' : undefined}
            rel={item.newTab ? 'noreferrer' : undefined}
            prefetch={false}
            className="block text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)] hover:text-[var(--accent-strong)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
