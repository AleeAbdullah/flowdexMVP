import Link from 'next/link';
import { getAuthenticatedAppContext } from '@/lib/auth-server';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/routes';
import { DataKicker, GlassPanel, SectionHeading } from '@/components/flowdex/primitives';
import { SignOutButton } from '../_components/sign-out-button';

export default async function AccountRoute() {
  const { session, profile } = await getAuthenticatedAppContext();
  const displayName = session.user.name || profile.email;

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
            <DataKicker label="Role" value={profile.role} />
            <DataKicker label="Status" value={profile.status} />
            <DataKicker label="Wallets" value={`${profile.wallets.length}`} />
            <DataKicker label="Session" value={session.session.id.slice(0, 8)} />
          </div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Identity</div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">{displayName}</div>
          <div className="mt-2 text-sm text-[var(--muted)]">{profile.email}</div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Wallet Readiness</div>
          <div className="mt-4 text-lg font-bold text-[var(--text)]">
            {profile.wallets.length > 0 ? 'Ready for protected execution' : 'Link a wallet first'}
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Embedded wallet authentication and backend wallet-link persistence are separate from app session auth by design. If none are linked yet, the wallets screen is the next step before simulation and tracking.
          </p>
          <div className="mt-4">
            <Button variant="glass" asChild>
              <Link href={ROUTES.WORKSPACE.WALLETS}>Open wallets</Link>
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
          {profile.wallets.length > 0 ? profile.wallets.map(wallet => (
            <div
              key={wallet.id}
              className="flex flex-col gap-3 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-semibold text-[var(--text)]">{wallet.network}</div>
                <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">{wallet.address}</div>
              </div>
              <div className="text-sm text-[var(--cyan)]">
                {wallet.verifiedAt ? 'Linked to ledger flow' : 'Pending link'}
              </div>
            </div>
          )) : (
            <div className="px-6 py-5 text-sm text-[var(--muted)]">
              No wallets linked yet. Move to the Wallets tab to authenticate and link embedded wallet ownership.
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
