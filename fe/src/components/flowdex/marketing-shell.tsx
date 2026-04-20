import type { ReactNode } from 'react';
import Link from 'next/link';
import { CircleAlert, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MarketingNav } from './marketing-nav';
import { FlowdexWordmark } from './primitives';

export async function MarketingShell({
  children,
}: {
  children: ReactNode;
}) {
  let isAuthenticated = false;

  if (process.env.NEXT_PUBLIC_STATIC_EXPORT !== 'true') {
    const { getOptionalSession } = await import('@/lib/auth-server');
    const session = await getOptionalSession();
    isAuthenticated = Boolean(session);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--cyan)_15%,transparent),transparent_22%),radial-gradient(circle_at_78%_8%,color-mix(in_srgb,var(--green)_10%,transparent),transparent_20%)]" />

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="border-b border-[var(--accent-border)] bg-[var(--accent-bg)] backdrop-blur-xl">
          <div className="section-shell flex min-h-9 items-center justify-center gap-x-6 gap-y-2 py-2 text-[11px] font-medium text-[var(--muted)] max-lg:flex-wrap">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Badge variant="success" className="gap-2 text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--green)] shadow-[0_0_14px_var(--green)]" />
                PRESALE LIVE
              </Badge>
              <span>$FDN Price: <span className="font-data font-bold text-[var(--text)]">$0.001</span></span>
              <span>Listing: <span className="font-data font-bold text-[var(--text)]">$0.05</span></span>
              <span>Discount: <span className="font-data font-bold text-[var(--green)]">-98%</span></span>
              <span>Tier: <span className="font-data font-bold text-[var(--cyan)]">1 of 8</span></span>
            </div>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[var(--cyan)] hover:text-[var(--text)]"
            >
              <Send className="h-3.5 w-3.5" />
              Join Telegram
            </a>
          </div>
        </div>
        <MarketingNav isAuthenticated={isAuthenticated} />
      </header>

      <main className="pt-40 md:pt-32">{children}</main>

      <footer className="border-t border-[var(--card-border)] bg-[var(--footer)]">
        <div className="section-shell grid gap-10 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <FlowdexWordmark compact />
            <p className="max-w-sm text-sm leading-7 text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
              The Universal Crypto Exchange. Trade crypto, stocks, forex, gold and target 500+ assets at full launch. Non-custodial. Cross-chain.
            </p>
          </div>

          <FooterColumn
            title="Resources"
            items={[
              { label: 'Whitepaper', href: '/whitepaper' },
              { label: 'Docs', href: '/whitepaper' },
              { label: 'Audit Reports', href: '/whitepaper' },
              { label: 'Bug Bounty', href: '/whitepaper' },
            ]}
          />
          <FooterColumn
            title="Community"
            items={[
              { label: 'Telegram', href: 'https://t.me' },
              { label: 'Twitter / X', href: 'https://x.com' },
              { label: 'Discord', href: 'https://discord.com' },
              { label: 'Medium', href: 'https://medium.com' },
            ]}
          />
          <FooterColumn
            title="Legal"
            items={[
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Disclaimer', href: '/legal' },
            ]}
          />
        </div>
        <div className="section-shell pb-6">
          <Alert variant="brand">
            <CircleAlert />
            <AlertTitle>Presale Notice</AlertTitle>
            <AlertDescription>
              This website is for informational and promotional purposes only. Participation in any presale involves risk and should not be treated as legal, tax, or financial advice.
            </AlertDescription>
          </Alert>
        </div>
        <Separator className="bg-[color-mix(in_srgb,var(--muted)_25%,transparent)]" />
        <div className="section-shell flex flex-col gap-2 py-4 text-xs text-[color-mix(in_srgb,var(--text)_54%,transparent)] md:flex-row md:items-center md:justify-between">
          <span>© 2026 Crypto Presale. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>$FDN tokens are utility tokens. Not financial advice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn(props: {
  title: string;
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] font-bold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_50%,transparent)] uppercase">
        {props.title}
      </div>
      <div className="space-y-3">
        {props.items.map((item) => {
          if (item.href.startsWith('http')) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)] hover:text-[var(--cyan)]"
              >
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="block text-sm text-[color-mix(in_srgb,var(--text)_72%,transparent)] hover:text-[var(--cyan)]"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
