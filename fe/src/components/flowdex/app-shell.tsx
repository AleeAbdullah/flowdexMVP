'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Coins, Layers3, ShieldCheck } from 'lucide-react';
import type { AuthMe } from '@/dal/app/types';
import { usePresaleConfig, usePresaleStats } from '@/dal/market/hooks';
import { SignOutButton } from './sign-out-button';
import { FlowdexWordmark, GlassPanel } from './primitives';
import { formatCurrency } from './utils';

const appNav = [
  { label: 'Dashboard', href: '' },
  { label: 'Account', href: 'account' },
  { label: 'Wallets', href: 'wallets' },
  { label: 'Buy', href: 'buy' },
  { label: 'Transactions', href: 'transactions' },
  { label: 'Trade', href: 'trade' },
  { label: 'Portfolio', href: 'portfolio' },
  { label: 'Stake', href: 'stake' },
  { label: 'Govern', href: 'govern' },
  { label: 'FlowChain', href: 'flowchain' },
];

export function AppShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile: AuthMe;
}) {
  const pathname = usePathname();
  const statsQuery = usePresaleStats();
  const configQuery = usePresaleConfig();
  const nav = profile.role === 'ADMIN'
    ? [...appNav, { label: 'Admin', href: 'admin' }]
    : appNav;

  const stats = statsQuery.data;
  const config = configQuery.data;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#040a12_0%,#07111e_45%,#050b15_100%)]">
      <div className="section-shell py-6">
        <div className="mb-6 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <FlowdexWordmark />
            </Link>
            <div className="rounded-full border border-cyan-400/16 bg-cyan-400/8 px-3 py-1 text-[10px] font-bold tracking-[0.24em] text-cyan-200 uppercase">
              Authenticated Surface
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 xl:items-end">
            <nav className="flex flex-wrap gap-2">
              {nav.map(item => {
                const href = item.href ? `/app/${item.href}` : '/app';
                const isActive = href === '/app'
                  ? pathname === '/app'
                  : pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-cyan-400 text-slate-950' : 'border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--text)]'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">{profile.email}</span>
                <span className="mx-2 text-[color-mix(in_srgb,var(--text)_45%,transparent)]">•</span>
                <span>{profile.role}</span>
                <span className="mx-2 text-[color-mix(in_srgb,var(--text)_45%,transparent)]">•</span>
                <span>{profile.wallets.length} wallets</span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3 text-cyan-200">
              <Coins className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-[0.22em] uppercase">Presale Price</span>
            </div>
            <div className="font-data mt-4 text-2xl text-[var(--text)]">
              {stats ? formatCurrency(stats.currentTokenPriceUsd, 3) : '$0.001'}
            </div>
          </GlassPanel>
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3 text-cyan-200">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-[0.22em] uppercase">Display Raise</span>
            </div>
            <div className="font-data mt-4 text-2xl text-[var(--text)]">
              {stats ? formatCurrency(stats.fundsRaisedDisplayUsd, 0) : '$0'}
            </div>
          </GlassPanel>
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3 text-cyan-200">
              <Layers3 className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-[0.22em] uppercase">Accepted Assets</span>
            </div>
            <div className="font-data mt-4 text-2xl text-[var(--text)]">{config?.supportedAssets.length ?? 0}</div>
          </GlassPanel>
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3 text-cyan-200">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-xs font-semibold tracking-[0.22em] uppercase">Flow Status</span>
            </div>
            <div className="mt-4 text-lg font-bold text-[var(--text)]">
              {profile.wallets.length > 0 ? 'Ready for protected flows' : 'Link a wallet to continue'}
            </div>
          </GlassPanel>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
