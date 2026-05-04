'use client';

import { useEffect, useState } from 'react';
import { AuthCard } from '@account-kit/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WALLET_NETWORKS, WALLET_PROVIDERS, type WalletNetwork, type WalletProvider } from '@/dal/app/wallets/wallets.types';
import { GlassPanel } from '@/components/flowdex/primitives';
import { CheckCircle2, Info, Mail, ShieldCheck, Wallet } from '@/icons';
import { cn } from '@/lib/utils';
import type { useMetaMaskWallet } from '../hooks/use-metamask-wallet';
import { NETWORK_LABELS } from '../constants';

type MetaMaskState = ReturnType<typeof useMetaMaskWallet>;
const METAMASK_HELP_ATTEMPT_THRESHOLD = 4;

export function WalletLinkPanel(props: {
  state: {
    embeddedAddress: string | null | undefined;
    isLoadingAccount: boolean;
    network: WalletNetwork;
    provider: WalletProvider;
    setNetwork: (value: WalletNetwork) => void;
    setProvider: (value: WalletProvider) => void;
  };
  metaMask: MetaMaskState;
  actions: {
    isLinking: boolean;
    linkWalletBlockReason: string | null;
    onLinkWallet: () => Promise<void>;
  };
}) {
  const [metaMaskLinkIssueCount, setMetaMaskLinkIssueCount] = useState(0);
  const connectedAddress = props.state.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED
    ? (props.state.embeddedAddress ?? 'Sign in to prepare your wallet address')
    : (props.metaMask.account ?? 'Connect MetaMask to select an account');
  const isAlchemyProvider = props.state.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED;
  const showMetaMaskHelp = props.state.provider === WALLET_PROVIDERS.METAMASK
    && metaMaskLinkIssueCount >= METAMASK_HELP_ATTEMPT_THRESHOLD;

  useEffect(() => {
    setMetaMaskLinkIssueCount(0);
  }, [props.metaMask.account, props.state.provider]);

  const registerMetaMaskLinkIssue = () => {
    if (props.state.provider !== WALLET_PROVIDERS.METAMASK) {
      return;
    }

    setMetaMaskLinkIssueCount(count => count + 1);
  };

  const handleLinkWallet = async () => {
    if (props.actions.linkWalletBlockReason) {
      toast.info(props.actions.linkWalletBlockReason);
      registerMetaMaskLinkIssue();
      return;
    }

    try {
      await props.actions.onLinkWallet();
      setMetaMaskLinkIssueCount(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'MetaMask link request did not complete.');
      registerMetaMaskLinkIssue();
    }
  };

  return (
    <GlassPanel className="flex flex-col gap-4 p-4 lg:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--cyan)]">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--cyan)] uppercase">Wallet setup</div>
            <h1 className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-[var(--text)]">
              Connect your wallet
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Pick how you want to connect, confirm the network, then link the wallet to this FlowDex account.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-2 text-xs font-semibold text-[var(--text)] md:max-w-[14rem]">
          <div className="flex items-center gap-2 text-[var(--cyan)]">
            <ShieldCheck className="h-4 w-4" />
            Account protected
          </div>
          <p className="mt-1 text-[11px] leading-5 text-[color-mix(in_srgb,var(--text)_64%,transparent)]">
            Linking enables buy checks and receipt tracking.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-2">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Wallet option
          </div>
          <ToggleGroup
            type="single"
            value={props.state.provider}
            onValueChange={(value: WalletProvider) => {
              if (value) {
                props.state.setProvider(value);
              }
            }}
            className="grid grid-cols-2 gap-2"
          >
            <ToggleGroupItem
              value={WALLET_PROVIDERS.ALCHEMY_EMBEDDED}
              className="h-auto min-h-16 justify-start rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-3 text-left text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[var(--accent-bg)] data-[state=on]:text-[var(--text)]"
            >
              <span className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold">Alchemy embedded</span>
                <span className="text-[11px] font-medium leading-4 text-[var(--muted)]">Use email-based wallet access</span>
              </span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value={WALLET_PROVIDERS.METAMASK}
              className="h-auto min-h-16 justify-start rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-3 text-left text-[var(--text)] data-[state=on]:border-[var(--accent-strong)] data-[state=on]:bg-[var(--accent-bg)] data-[state=on]:text-[var(--text)]"
            >
              <span className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold">MetaMask</span>
                <span className="text-[11px] font-medium leading-4 text-[var(--muted)]">Use an existing browser wallet</span>
              </span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Network
          </div>
          <Select value={props.state.network} onValueChange={(value: WalletNetwork) => props.state.setNetwork(value)}>
            <SelectTrigger className="h-11 rounded-xl border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]">
              <SelectValue placeholder="Choose network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WALLET_NETWORKS.BASE_SEPOLIA}>Base Sepolia</SelectItem>
              <SelectItem value={WALLET_NETWORKS.ETH_SEPOLIA}>Ethereum Sepolia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showMetaMaskHelp ? (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-3 text-sm text-[var(--text)]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--cyan)_36%,transparent)] bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)] text-[var(--cyan)]">
            <Info className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">MetaMask may need your attention</div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              If no wallet window opens, open MetaMask from your browser toolbar, unlock it, select or connect your account, then return here and click Link wallet again.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-3">
          {isAlchemyProvider ? (
            <div className="grid gap-3 xl:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <Mail className="h-4 w-4 text-[var(--cyan)]" />
                  Alchemy signup
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  Sign in or create an embedded wallet, then use the generated address below to link it to FlowDex.
                </p>
                <div className="mt-4 grid gap-2 text-xs text-[color-mix(in_srgb,var(--text)_72%,transparent)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cyan)]" />
                    Account Kit handles wallet access
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cyan)]" />
                    FlowDex links only after confirmation
                  </div>
                </div>
              </div>
              <div className="flowdex-account-kit-shell overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--accent-strong)_18%,var(--card-border))] bg-[color-mix(in_srgb,var(--bg)_48%,var(--card-bg))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <AuthCard className="flowdex-account-kit" />
              </div>
            </div>
          ) : (
            <div className="flex min-h-28 flex-col justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-4 text-sm text-[var(--text)]">
              <div className="font-semibold">
                {props.metaMask.isAvailable ? 'MetaMask is available' : 'MetaMask was not detected'}
              </div>
              <p className="mt-2 leading-6 text-[var(--muted)]">
                {props.metaMask.isAvailable
                  ? 'Connect your browser wallet, then link the selected account to FlowDex.'
                  : 'Install or enable MetaMask in this browser to continue with this wallet option.'}
              </p>
              {props.metaMask.account ? (
                <div className="mt-3 break-all rounded-lg border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_42%,var(--card-bg))] px-3 py-2 text-xs text-[var(--text)]">
                  {props.metaMask.account}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-[1rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm text-[var(--text)]">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[var(--cyan)]" />
              Wallet address
            </div>
            <div className="mt-2 break-all text-xs leading-5 text-[color-mix(in_srgb,var(--text)_68%,transparent)]">
              {connectedAddress}
            </div>
            {props.state.provider === WALLET_PROVIDERS.ALCHEMY_EMBEDDED && props.state.isLoadingAccount ? (
              <div className="mt-2 text-xs text-[var(--muted)]">Preparing wallet address...</div>
            ) : null}
            {props.state.provider === WALLET_PROVIDERS.METAMASK && props.metaMask.chainId ? (
              <div className="mt-2 text-xs text-[var(--muted)]">
                Selected network: {NETWORK_LABELS[props.state.network]}
              </div>
            ) : null}
          </div>

          <Button
            variant="brand"
            className={cn(
              'h-11 w-full',
              props.actions.linkWalletBlockReason && 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:brightness-100',
            )}
            aria-disabled={Boolean(props.actions.linkWalletBlockReason)}
            onClick={() => void handleLinkWallet()}
          >
            {props.actions.isLinking ? 'Linking...' : 'Link wallet'}
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}
