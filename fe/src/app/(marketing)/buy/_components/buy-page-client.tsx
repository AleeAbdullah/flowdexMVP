'use client';

import dynamic from 'next/dynamic';

const BuyPageContent = dynamic(
  () => import('./buy-page-content').then(module => module.BuyPageContent),
  {
    ssr: false,
    loading: () => (
      <main className="section-shell section-pad">
        <div className="min-h-[36rem] animate-pulse rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--buy-panel)]" />
      </main>
    ),
  },
);

export function BuyPageClient() {
  return <BuyPageContent />;
}
