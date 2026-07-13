'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Menu, X } from '@/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import { MarketingWalletNavControl } from './marketing-wallet-nav-control';
import { FlowdexWordmark } from './primitives';
import { ThemeToggle } from './theme-toggle';
import { getActiveMarketingNavHref, MARKETING_NAV_ITEMS } from './marketing-nav.utils';

type MarketingPrimaryAction = {
  href: string;
  label: string;
};

export function MarketingNavClient(props: {
  primaryAction: MarketingPrimaryAction;
}) {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const activeHref = getActiveMarketingNavHref(pathname);
  const isBuyPage = pathname === ROUTES.MARKETING.BUY;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 32);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav data-state={menuState ? 'active' : 'inactive'} className="group w-full px-2">
      <div
        className={cn(
          'mx-auto mt-2 max-w-6xl rounded-2xl px-4 transition-[max-width,padding,border-color,background-color,box-shadow] duration-300 md:px-8 lg:px-12',
          isScrolled
            && 'max-w-5xl border border-[var(--card-border)] bg-[var(--nav)] px-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl md:px-5',
        )}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-8 lg:py-4">
          <div className="flex w-full items-center justify-between lg:w-auto">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={ROUTES.MARKETING.HOME}
                className="shrink-0"
                aria-label="FlowDex home"
                onClick={() => setMenuState(false)}
              >
                <FlowdexWordmark />
              </Link>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMenuState(current => !current)}
              aria-label={menuState ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuState}
              className="relative z-20 h-11 w-11 rounded-full border border-transparent text-[var(--text)] hover:border-[var(--card-border)] hover:bg-[var(--card-bg)] lg:hidden"
            >
              <Menu
                aria-hidden="true"
                className="m-auto h-5 w-5 transition-[transform,opacity] duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:rotate-180 group-data-[state=active]:opacity-0"
              />
              <X
                aria-hidden="true"
                className="absolute inset-0 m-auto h-5 w-5 -rotate-180 scale-0 opacity-0 transition-[transform,opacity] duration-200 group-data-[state=active]:scale-100 group-data-[state=active]:rotate-0 group-data-[state=active]:opacity-100"
              />
            </Button>
          </div>

          <div className="absolute inset-0 m-auto hidden size-fit lg:block">
            <ul className="flex gap-6 text-sm">
              {MARKETING_NAV_ITEMS.map(item => {
                const isActive = activeHref === item.href;

                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      className={cn(
                        'block font-medium transition-[color] duration-150',
                        isActive
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--accent-strong)]',
                      )}
                    >
                      {item.label}
                    </Link>
                    {isActive ? (
                      <span className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 rounded-full bg-[var(--accent-strong)]" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            {isBuyPage ? (
              <Suspense fallback={null}>
                <MarketingWalletNavControl />
              </Suspense>
            ) : (
              <Button variant="brand" size="sm" asChild>
                <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
              </Button>
            )}
          </div>

          <div className="mb-5 hidden w-full flex-wrap items-center justify-end space-y-6 rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--card-bg-strong)] p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:hidden lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
            <ul className="space-y-5 text-base">
              {MARKETING_NAV_ITEMS.map(item => {
                const isActive = activeHref === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuState(false)}
                      className={cn(
                        'block font-semibold transition-[color] duration-150',
                        isActive
                          ? 'text-[var(--text)]'
                          : 'text-[var(--muted)] hover:text-[var(--accent-strong)]',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
              <ThemeToggle />
              {isBuyPage ? (
                <Suspense fallback={null}>
                  <MarketingWalletNavControl onMobileNavigate={() => setMenuState(false)} />
                </Suspense>
              ) : (
                <Button variant="brand" size="sm" asChild className="sm:flex-1">
                  <Link href={props.primaryAction.href} onClick={() => setMenuState(false)}>
                    {props.primaryAction.label}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
