'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import type { IAuthMe } from '@/dal/app/auth/auth.types';
import type { Icon } from '@/icons';
import { Mail, Settings, ShieldCheck, UserRound, Wallet } from '@/icons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import { truncateMiddle } from '@/components/flowdex/utils';

import { SignOutButton } from '../../_components/sign-out-button';

const ACCOUNT_TAB_VALUES = ['profile', 'wallets', 'session'] as const;

type AccountTab = (typeof ACCOUNT_TAB_VALUES)[number];

const ACCOUNT_TABS: Array<{
  value: AccountTab;
  label: string;
  icon: Icon;
}> = [
  { value: 'profile', label: 'Profile', icon: UserRound },
  { value: 'wallets', label: 'Wallets', icon: Wallet },
  { value: 'session', label: 'Session', icon: ShieldCheck },
];

type AccountSettingsClientProps = {
  displayName: string;
  profile: IAuthMe;
  sessionId: string;
};

type StatusChipTone = 'accent' | 'neutral' | 'warning';

type StatusChipProps = {
  children: ReactNode;
  tone?: StatusChipTone;
};

type SettingsGroupProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

type SettingsRowProps = {
  label: string;
  description?: string;
  icon?: Icon;
  value?: ReactNode;
  children?: ReactNode;
};

function normalizeLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, character => character.toUpperCase());
}

function StatusChip({ children, tone = 'accent' }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-bold tracking-[0.16em] uppercase',
        tone === 'accent' && 'border-cyan-300/35 bg-cyan-300/10 text-cyan-200',
        tone === 'neutral' && 'border-[var(--card-border)] bg-[var(--accent-bg)] text-[color-mix(in_srgb,var(--text)_78%,transparent)]',
        tone === 'warning' && 'border-amber-300/30 bg-amber-300/10 text-amber-100',
      )}
    >
      {children}
    </span>
  );
}

function SettingsGroup({ title, description, children }: SettingsGroupProps) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_24px_80px_rgba(2,8,23,0.16)]">
      <div className="border-b border-[var(--card-border)] px-5 py-4">
        <h2 className="font-heading text-base font-semibold tracking-normal text-[var(--text)]">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      <div className="divide-y divide-[var(--card-border)]">{children}</div>
    </section>
  );
}

function SettingsRow({ label, description, icon: IconComponent, value, children }: SettingsRowProps) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 gap-3">
        {IconComponent ? (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/18 bg-cyan-300/8 text-cyan-200">
            <IconComponent className="size-4" aria-hidden="true" />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text)]">{label}</div>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-start md:justify-end">
        {children ?? (
          <span className="max-w-full break-words text-left text-sm font-semibold text-[color-mix(in_srgb,var(--text)_84%,transparent)] md:max-w-[28rem] md:text-right">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

export function AccountSettingsClient({ displayName, profile, sessionId }: AccountSettingsClientProps) {
  const [activeTab = 'profile', setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(ACCOUNT_TAB_VALUES)
      .withDefault('profile')
      .withOptions({ history: 'push' }),
  );

  const linkedWalletsLabel = `${profile.wallets.length} linked`;
  const statusTone: StatusChipTone = profile.status.toLowerCase() === 'active' ? 'accent' : 'warning';

  return (
    <div className="space-y-6">
      <header className="rounded-[1.25rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_72%,transparent)] px-5 py-4 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-[var(--cyan)] uppercase">
              <Settings className="size-3.5" aria-hidden="true" />
              Account settings
            </div>
            <h1 className="font-heading mt-2 text-2xl font-semibold tracking-normal text-[var(--text)]">
              Manage account access
            </h1>
            <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[var(--muted)]">
              <Mail className="size-4 shrink-0 text-cyan-200" aria-hidden="true" />
              <span className="truncate">{profile.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip>{normalizeLabel(profile.role)}</StatusChip>
            <StatusChip tone={statusTone}>{normalizeLabel(profile.status)}</StatusChip>
            <StatusChip tone="neutral">{linkedWalletsLabel}</StatusChip>
          </div>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          void setActiveTab(value as AccountTab);
        }}
        className="space-y-5"
      >
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-[1rem] border border-[var(--card-border)] bg-[var(--accent-bg)] p-1">
          {ACCOUNT_TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="min-w-[9rem] justify-center gap-2 rounded-[0.8rem] border border-transparent px-4 py-2.5 text-sm font-semibold text-[var(--muted)] shadow-none transition data-[state=active]:border-cyan-300/25 data-[state=active]:bg-cyan-300/12 data-[state=active]:text-cyan-100 data-[state=active]:shadow-none"
            >
              <tab.icon className="size-4" aria-hidden="true" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <SettingsGroup
            title="Profile"
            description="Read-only identity details used to authorize your FlowDex workspace."
          >
            <SettingsRow
              icon={UserRound}
              label="Display name"
              description="Shown in the app header and session-aware views."
              value={displayName}
            />
            <SettingsRow
              icon={Mail}
              label="Email"
              description="Primary login and account recovery address."
              value={profile.email}
            />
            <SettingsRow
              icon={ShieldCheck}
              label="Role"
              description="Permission level assigned by FlowDex."
            >
              <StatusChip>{normalizeLabel(profile.role)}</StatusChip>
            </SettingsRow>
            <SettingsRow
              label="Account status"
              description="Current backend account state."
            >
              <StatusChip tone={statusTone}>{normalizeLabel(profile.status)}</StatusChip>
            </SettingsRow>
            <SettingsRow
              label="Session ID"
              description="Current authenticated app session identifier."
              value={truncateMiddle(sessionId, 8, 6)}
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="wallets" className="mt-0">
          <SettingsGroup
            title="Wallets"
            description="Wallets linked to this account for market access, simulation, and activity tracking."
          >
            {profile.wallets.length > 0 ? (
              <>
                {profile.wallets.map(wallet => (
                  <SettingsRow
                    key={wallet.id}
                    icon={Wallet}
                    label={normalizeLabel(wallet.network)}
                    description={`${truncateMiddle(wallet.address)} - Chain ${wallet.chainId}`}
                  >
                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                      <StatusChip tone="neutral">{normalizeLabel(wallet.provider)}</StatusChip>
                      <StatusChip tone={wallet.verifiedAt ? 'accent' : 'warning'}>
                        {wallet.verifiedAt ? normalizeLabel(wallet.trustLevel) : 'Pending Link'}
                      </StatusChip>
                      {wallet.isPrimary ? <StatusChip>Primary</StatusChip> : <StatusChip tone="neutral">Linked</StatusChip>}
                    </div>
                  </SettingsRow>
                ))}
                <SettingsRow
                  label="Wallet management"
                  description="Open the wallet workspace to link another wallet or refresh embedded wallet state."
                >
                  <Button variant="glass" size="sm" asChild>
                    <Link href={ROUTES.WORKSPACE.WALLETS}>Open wallets</Link>
                  </Button>
                </SettingsRow>
              </>
            ) : (
              <SettingsRow
                icon={Wallet}
                label="Linked wallets"
                description="No wallets are linked yet. Add one before using protected wallet-first flows."
              >
                <Button variant="brand" size="sm" asChild>
                  <Link href={ROUTES.WORKSPACE.WALLETS}>Open wallets</Link>
                </Button>
              </SettingsRow>
            )}
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="session" className="mt-0">
          <SettingsGroup
            title="Session"
            description="Occasional account controls for the current browser session."
          >
            <SettingsRow
              icon={ShieldCheck}
              label="Current session"
              description="This identifier changes when you sign in again."
              value={truncateMiddle(sessionId, 8, 6)}
            />
            <SettingsRow
              label="Sign out"
              description="End this browser session and return to the FlowDex login screen."
            >
              <SignOutButton />
            </SettingsRow>
          </SettingsGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
}
