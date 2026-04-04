import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOptionalSession } from '@/lib/auth-server';
import { FlowdexWordmark } from './primitives';

const navigation = [
  { label: 'About', href: '/about' },
  { label: 'Whitepaper', href: '/whitepaper' },
  { label: 'Updates', href: '/updates' },
  { label: 'Overview', href: '#overview' },
  { label: 'Tiers', href: '#tiers' },
  { label: 'Tokenomics', href: '#tokenomics' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'FAQ', href: '#faq' },
];

export async function MarketingShell({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.15),transparent_22%),radial-gradient(circle_at_78%_8%,rgba(34,197,94,0.10),transparent_20%)]" />

      <div className="relative border-b border-cyan-400/10 bg-[#07101e]/85 backdrop-blur-xl">
        <div className="section-shell flex min-h-9 items-center justify-between gap-3 py-2 text-[11px] font-medium text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(34,197,94,0.9)]" />
              Presale live at Tier 1
            </span>
            <span className="font-data text-cyan-200">$FDN 0.001</span>
          </div>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-cyan-200 hover:text-white"
          >
            <Send className="h-3.5 w-3.5" />
            Telegram community
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#050c16]/78 backdrop-blur-2xl">
        <div className="section-shell flex min-h-16 items-center justify-between gap-6 py-3">
          <Link href="/" className="shrink-0">
            <FlowdexWordmark />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href.startsWith('#') ? `/${item.href}` : item.href}
                className="text-sm font-semibold text-slate-300 hover:text-cyan-200"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Whitepaper
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">
                Signed in
              </div>
            ) : null}
            {!session ? (
              <Button variant="glass" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
            ) : null}
            <Button variant="glass" size="sm" asChild>
              <Link href={session ? '/app/account' : '/app/trade'}>
                {session ? 'Continue to App' : 'Product Vision'}
              </Link>
            </Button>
            <Button variant="brand" size="sm" asChild>
              <Link href="/buy">
                Buy $FDN
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/6 bg-[#050b15]/95">
        <div className="section-shell grid gap-10 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <FlowdexWordmark />
            <p className="max-w-sm text-sm leading-7 text-slate-400">
              FlowDex is building the non-custodial universal exchange for crypto, stocks,
              forex, gold, indices, and tokenized real-world assets from one on-chain interface.
            </p>
          </div>

          <FooterColumn
            title="Navigation"
            items={[
              { label: 'Home', href: `/` },
              { label: 'About', href: `/about` },
              { label: 'Buy', href: `/buy` },
              { label: 'Updates', href: `/updates` },
            ]}
          />
          <FooterColumn
            title="Resources"
            items={[
              { label: 'Whitepaper', href: '/whitepaper' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ]}
          />
          <FooterColumn
            title="Community"
            items={[
              { label: 'Telegram', href: 'https://t.me' },
              { label: 'X / Twitter', href: 'https://x.com' },
              { label: 'GitHub', href: 'https://github.com' },
            ]}
          />
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
      <div className="text-[11px] font-bold tracking-[0.32em] text-slate-500 uppercase">
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
                className="block text-sm text-slate-300 hover:text-cyan-200"
              >
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="block text-sm text-slate-300 hover:text-cyan-200"
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
