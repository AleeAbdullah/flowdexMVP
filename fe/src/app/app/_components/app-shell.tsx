'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { APP_USER_ROLES, type IAuthMe } from '@/dal/app/auth/auth.types';
import { useWallets } from '@/dal/app/wallets/wallets.services';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Menu, Settings, ShieldCheck } from '@/icons';
import { ROUTES } from '@/routes';
import { AppSidebar } from './app-sidebar';

export function AppShell(props: {
  children: ReactNode;
  displayName: string;
  profile: IAuthMe;
}) {
  const walletsQuery = useWallets({ items: props.profile.wallets });
  const linkedWallets = walletsQuery.data?.items ?? props.profile.wallets;
  const walletStatus = linkedWallets.length > 0 ? 'Wallet linked' : 'No wallet linked';
  const isAdmin = props.profile.role === APP_USER_ROLES.ADMIN;

  return (
    <SidebarProvider
      defaultOpen
      className="h-dvh overflow-hidden bg-[linear-gradient(180deg,var(--bg)_0%,color-mix(in_srgb,var(--bg)_70%,var(--bg-2))_45%,var(--bg)_100%)]"
    >
      <a
        href="#app-content"
        className="absolute left-4 top-4 z-[70] rounded-full border border-[var(--accent-border)] bg-[var(--surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text)] opacity-0 shadow-lg transition-[opacity,transform] duration-150 focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
      >
        Skip to App Content
      </a>
      <AppSidebar profile={props.profile} />
      <SidebarInset className="min-w-0 h-full min-h-0 overflow-hidden bg-transparent">
        <header className="shrink-0 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-xl">
          <div className="section-shell py-3">
            <div className="flex items-center justify-between gap-2 md:gap-3">
              <div className="flex min-w-0 flex-[0.75] items-center gap-3 md:flex-1">
                <SidebarTrigger className="hidden border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)] md:inline-flex" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.32em] text-[var(--cyan)] uppercase">
                    FlowDex App
                  </div>
                  <div className="truncate text-sm text-[color-mix(in_srgb,var(--text)_65%,transparent)]">
                    Wallet access, transaction checks, and activity tracking.
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-[1.25] items-center justify-between gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 md:w-[17rem] md:flex-none md:gap-3 md:px-4 md:py-2.5 lg:w-[18rem]">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="truncate text-sm font-semibold text-[var(--text)]">{props.displayName}</div>
                    {isAdmin ? (
                      <span
                        className="inline-flex h-4 shrink-0 items-center gap-0.5 rounded-full border border-[color-mix(in_srgb,var(--accent-strong)_24%,var(--card-border))] bg-[color-mix(in_srgb,var(--accent-strong)_10%,transparent)] px-1 text-[8px] font-bold text-[var(--accent-strong)] md:h-5 md:gap-1 md:px-1.5 md:text-[10px]"
                        title="Admin user"
                      >
                        <ShieldCheck className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-[11px] text-[color-mix(in_srgb,var(--text)_55%,transparent)]">
                    {props.profile.email}
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-[color-mix(in_srgb,var(--text)_70%,transparent)]">
                    {walletStatus}
                  </div>
                </div>
                <Button
                  variant="glass"
                  size="icon"
                  asChild
                  className="h-9 w-9 shrink-0 rounded-xl"
                >
                  <Link href={ROUTES.DASHBOARD.ACCOUNT} aria-label="Open account settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                <SidebarTrigger
                  aria-label="Open navigation menu"
                  className="h-9 w-9 shrink-0 rounded-xl border border-[var(--card-border)] bg-transparent text-[var(--text)] backdrop-blur-xl hover:border-[var(--accent-strong)] hover:text-[var(--accent-strong)] md:hidden"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open navigation menu</span>
                </SidebarTrigger>
              </div>
            </div>
          </div>
        </header>

        <main id="app-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
          <div className="section-shell py-6 md:py-8">
            {props.children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
