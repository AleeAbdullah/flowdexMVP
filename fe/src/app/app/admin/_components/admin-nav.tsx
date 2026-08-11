'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/app/app/_components/sign-out-button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';

const navItems = [
  { href: ROUTES.ADMIN.HOME, label: 'Overview', match: (path: string) => path === ROUTES.ADMIN.HOME },
  {
    href: ROUTES.ADMIN.TRANSACTIONS,
    label: 'Payments',
    match: (path: string) => path === ROUTES.ADMIN.TRANSACTIONS || path.startsWith(`${ROUTES.ADMIN.TRANSACTIONS}/`),
  },
  {
    href: ROUTES.ADMIN.BLOGS,
    label: 'Blog',
    match: (path: string) => path === ROUTES.ADMIN.BLOGS,
  },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
      <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
        {navItems.map(item => {
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--accent-bg)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--accent-strong)]',
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href={ROUTES.MARKETING.HOME}
          className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)]"
        >
          Public site
        </Link>
      </nav>
      <SignOutButton />
    </div>
  );
}
