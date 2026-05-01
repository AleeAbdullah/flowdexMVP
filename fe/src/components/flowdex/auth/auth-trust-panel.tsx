import { CheckCircle2, ShieldCheck, Wallet } from '@/icons';

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Session-first access',
    body: 'Sign in first, then move into protected account and wallet actions from a stable app session.',
  },
  {
    icon: Wallet,
    title: 'Wallet linking comes next',
    body: 'After account access, the protected app guides wallet linking and any chain-specific flow from the right screen.',
  },
  {
    icon: CheckCircle2,
    title: 'Protected routes stay gated',
    body: 'Only active sessions can move into the protected FlowDex app surface and its account workflows.',
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
