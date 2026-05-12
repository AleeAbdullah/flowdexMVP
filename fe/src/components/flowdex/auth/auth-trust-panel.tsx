import { CheckCircle2, ShieldCheck, Wallet } from '@/icons';

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Admin-only route',
    body: 'This email login exists only for FlowDex operators managing admin dashboards and transaction oversight.',
  },
  {
    icon: Wallet,
    title: 'Contributors use wallets',
    body: 'Contributor access no longer uses account creation. Wallet verification and receipts live on the public buy and transaction routes.',
  },
  {
    icon: CheckCircle2,
    title: 'Admin guards enforce access',
    body: 'The footer login link is only navigation. Real protection comes from Better Auth admin guards and role checks.',
  },
];

export function AuthTrustPanel() {
  return (
    <div className="grid gap-3">
      {trustPoints.map(point => {
        const Icon = point.icon;

        return (
          <div
            key={point.title}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <Icon aria-hidden className="h-4 w-4 text-[var(--cyan)]" />
              {point.title}
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {point.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
