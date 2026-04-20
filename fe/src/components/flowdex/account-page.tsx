import type { BetterAuthSession } from '@/lib/auth-server';
import Link from 'next/link';
import type { AuthMe } from '@/dal/app/types';
import { Button } from '@/components/ui/button';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { SignOutButton } from './sign-out-button';

export function AccountPage(props: {
  session: BetterAuthSession;
  profile: AuthMe;
}) {
  const displayName = props.session.user.name || props.profile.email;

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
        <SectionHeading
          eyebrow="Account"
          title={`Welcome back, ${displayName}.`}
          description="This screen is now a focused identity and session surface. Dashboard metrics live on `/app`; this page stays responsible for profile state, backend role/status visibility, and account control."
        />
        <div className="space-y-4 rounded-[1.5rem] border border-cyan-400/12 bg-cyan-400/6 p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-cyan-300 uppercase">Session Facts</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DataKicker label="Role" value={props.profile.role} />
            <DataKicker label="Status" value={props.profile.status} />
            <DataKicker label="Wallets" value={`${props.profile.wallets.length}`} />
            <DataKicker label="Session" value={props.session.session.id.slice(0, 8)} />
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Identity</div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">{displayName}</div>
          <div className="mt-2 text-sm text-[var(--muted)]">{props.profile.email}</div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Wallet Readiness</div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">
            {props.profile.wallets.length > 0 ? 'Ready for protected execution' : 'Link a wallet first'}
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Wallet verification stays separate from email auth by design. If none are linked yet, the wallets screen is the next required step before creating purchase intents.
          </p>
          <div className="mt-4">
            <Button variant="glass" asChild>
              <Link href="/app/wallets">Open wallets</Link>
            </Button>
          </div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Session Control</div>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
          Linked Wallet Snapshot
        </div>
        <div>
          {props.profile.wallets.length > 0 ? props.profile.wallets.map(wallet => (
            <div
              key={wallet.id}
              className="flex flex-col gap-3 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-semibold text-[var(--text)]">{wallet.chain}</div>
                <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">{wallet.address}</div>
              </div>
              <div className="text-sm text-[var(--cyan)]">
                {wallet.verifiedAt ? 'Verified for Phase 2 rails' : 'Pending verification'}
              </div>
            </div>
          )) : (
            <div className="px-6 py-5 text-sm text-[var(--muted)]">
              No wallets linked yet. Move to the Wallets tab to generate a challenge and verify ownership.
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
