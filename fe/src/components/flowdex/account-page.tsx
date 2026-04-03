import type { BetterAuthSession } from '@/lib/auth-server';
import type { AuthMe } from '@/dal/app/types';
import { DataKicker, GlassPanel, SectionHeading } from './primitives';
import { SignOutButton } from './sign-out-button';

export function AccountPage(props: {
  session: BetterAuthSession;
  profile: AuthMe;
}) {
  const displayName = props.session.user.name || props.profile.email;

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Account"
          title={`Welcome back, ${displayName}.`}
          description="This page is hydrated from the backend auth context, not just the browser session. It is the canonical surface for role, status, and linked wallet visibility."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DataKicker label="Role" value={props.profile.role} />
          <DataKicker label="Status" value={props.profile.status} />
          <DataKicker label="Wallets" value={`${props.profile.wallets.length}`} />
          <DataKicker label="Session" value={props.session.session.id.slice(0, 8)} />
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-3">
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Identity</div>
          <div className="mt-4 text-lg font-bold text-white">{displayName}</div>
          <div className="mt-2 text-sm text-slate-300">{props.profile.email}</div>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Wallet Readiness</div>
          <div className="mt-4 text-lg font-bold text-white">
            {props.profile.wallets.length > 0 ? 'Ready to buy' : 'Link a wallet first'}
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Purchase intents require a verified wallet. If none are linked yet, start from the Wallets tab before heading to the protected buy flow.
          </p>
        </GlassPanel>
        <GlassPanel className="p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Session Control</div>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="overflow-hidden">
        <div className="border-b border-white/8 px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
          Linked Wallet Snapshot
        </div>
        <div>
          {props.profile.wallets.length > 0 ? props.profile.wallets.map(wallet => (
            <div
              key={wallet.id}
              className="flex flex-col gap-3 border-b border-white/6 px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-semibold text-white">{wallet.chain}</div>
                <div className="mt-1 text-sm text-slate-400">{wallet.address}</div>
              </div>
              <div className="text-sm text-cyan-200">
                {wallet.verifiedAt ? 'Verified' : 'Pending verification'}
              </div>
            </div>
          )) : (
            <div className="px-6 py-5 text-sm text-slate-300">
              No wallets linked yet. Move to the Wallets tab to generate a challenge and verify ownership.
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
