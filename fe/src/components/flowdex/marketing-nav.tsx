'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FlowdexWordmark } from './primitives';
import { ThemeToggle } from './theme-toggle';
import {
  getActiveMarketingNavHref,
  getMarketingNavActions,
  MARKETING_NAV_ITEMS,
} from './marketing-nav.utils';

export function MarketingNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const activeHref = getActiveMarketingNavHref(pathname);
  const actions = getMarketingNavActions(isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav data-state={menuState ? 'active' : 'inactive'} className="group w-full px-2">
      <div
        className={cn(
          'mx-auto mt-2 max-w-6xl rounded-2xl px-4 transition-all duration-300 md:px-8 lg:px-12',
          isScrolled &&
          'max-w-5xl  border border-[var(--flowdex-card-border)] bg-[var(--flowdex-nav)] px-4 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-lg md:px-5',
        )}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-8 lg:py-4">
          <div className="flex w-full items-center justify-between lg:w-auto">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="shrink-0"
                aria-label="FlowDex home"
                onClick={() => setMenuState(false)}
              >
                <FlowdexWordmark />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMenuState(current => !current)}
              aria-label={menuState ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuState}
              className="relative z-20 -m-2.5 -mr-3 block cursor-pointer p-2.5 text-[var(--flowdex-text)] lg:hidden"
            >
              <Menu className="m-auto h-6 w-6 duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:rotate-180 group-data-[state=active]:opacity-0" />
              <X className="absolute inset-0 m-auto h-6 w-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:scale-100 group-data-[state=active]:rotate-0 group-data-[state=active]:opacity-100" />
            </button>
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
                        'block font-medium duration-150',
                        isActive
                          ? 'text-[var(--flowdex-text)]'
                          : 'text-[var(--flowdex-muted)] hover:text-[var(--flowdex-cyan)]',
                      )}
                    >
                      {item.label}
                    </Link>
                    {isActive ? (
                      <span className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 rounded-full bg-[var(--flowdex-cyan)]" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            {actions.includes('buy') ? (
              <Button variant="brand" size="sm" asChild>
                <Link href="/buy">Join Presale</Link>
              </Button>
            ) : null}
          </div>

          <div className="mb-5 hidden w-full flex-wrap items-center justify-end space-y-6 rounded-3xl border border-[var(--flowdex-card-border)] bg-[var(--flowdex-bg)]/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:hidden lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
            <ul className="space-y-5 text-base">
              {MARKETING_NAV_ITEMS.map(item => {
                const isActive = activeHref === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuState(false)}
                      className={cn(
                        'block font-semibold duration-150',
                        isActive
                          ? 'text-[var(--flowdex-text)]'
                          : 'text-[var(--flowdex-muted)] hover:text-[var(--flowdex-cyan)]',
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
              {actions.includes('buy') ? (
                <Button variant="brand" size="sm" asChild className="sm:flex-1">
                  <Link href="/buy" onClick={() => setMenuState(false)}>
                    Join Presale
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
