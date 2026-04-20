'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCreateWalletChallenge,
  useDeleteWallet,
  useVerifyWalletSignature,
  useWallets,
} from '@/dal/app/hooks';
import { GlassPanel, SectionHeading } from './primitives';

type Chain = 'ETH';

export function WalletsPage() {
  const walletsQuery = useWallets();
  const challengeMutation = useCreateWalletChallenge();
  const verifyMutation = useVerifyWalletSignature();
  const deleteMutation = useDeleteWallet();

  const [chain] = useState<Chain>('ETH');
  const [address, setAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [challengeExpiresAt, setChallengeExpiresAt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const wallets = walletsQuery.data?.items ?? [];
  const canAutoSign = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const win = window as Window & {
      ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
      tronWeb?: { trx?: { signMessageV2?: (message: string) => Promise<string> } };
    };

    return Boolean(win.ethereum?.request);
  }, []);

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Wallets"
          title="Link the EVM wallet that will anchor Phase 2 presale actions."
          description="Phase 2 wallet UX is intentionally narrowed to the EVM path used for both ETH and USDT ERC20 purchases. Challenge creation and signature verification are still delegated to the backend."
        />
        <div className="space-y-4 rounded-[1.5rem] border border-cyan-400/12 bg-cyan-400/6 p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">Phase 2 Wallet Flow</div>
          <ol className="space-y-3 text-sm leading-7 text-[var(--text)]">
            <li>1. Enter an EVM wallet address for ETH and USDT ERC20 purchases.</li>
            <li>2. Request a backend challenge bound to your user and address.</li>
            <li>3. Sign it with your wallet or paste the signature manually.</li>
            <li>4. Verify ownership and refresh the protected wallet list.</li>
          </ol>
        </div>
      </GlassPanel>

      {feedback ? (
        <GlassPanel
          className={`p-5 ${feedback.tone === 'error'
              ? 'border border-rose-400/20 bg-rose-500/10'
              : feedback.tone === 'success'
                ? 'border border-emerald-400/20 bg-emerald-500/10'
                : 'border border-cyan-400/20 bg-cyan-400/10'
            }`}
        >
          <p className="text-sm leading-7 text-[var(--text)]">{feedback.text}</p>
        </GlassPanel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassPanel className="p-6">
          <div className="space-y-4">
            <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Link Wallet</div>

            <div className="rounded-[1rem] border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3 text-sm text-[var(--text)]">
              EVM wallet mode is active. One verified wallet can now be used for both <span className="font-semibold">ETH</span> and <span className="font-semibold">USDT ERC20</span> purchase intents.
            </div>

            <Input
              value={address}
              onChange={event => setAddress(event.target.value)}
              placeholder="0x wallet address"
              className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
            />

            <Button
              variant="brand"
              className="w-full"
              disabled={challengeMutation.isPending || !address.trim()}
              onClick={async () => {
                try {
                  const challenge = await challengeMutation.mutateAsync({
                    chain,
                    address,
                  });

                  setActiveChallengeId(challenge.challengeId);
                  setChallengeMessage(challenge.message);
                  setChallengeExpiresAt(challenge.expiresAt);
                  setSignature('');
                  setFeedback({
                    tone: 'info',
                    text: `Challenge issued for the linked EVM wallet. It expires at ${new Date(challenge.expiresAt).toLocaleString()}.`,
                  });
                  toast.success('Challenge created');
                } catch (error) {
                  setFeedback({
                    tone: 'error',
                    text: error instanceof Error ? error.message : 'Could not create challenge',
                  });
                  toast.error(error instanceof Error ? error.message : 'Could not create challenge');
                }
              }}
            >
              {challengeMutation.isPending ? 'Creating challenge...' : 'Create challenge'}
            </Button>

            {activeChallengeId ? (
              <div className="space-y-4 rounded-[1.25rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">Challenge Message</div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">{challengeMessage}</pre>
                {challengeExpiresAt ? (
                  <div className="text-xs text-[color-mix(in_srgb,var(--text)_45%,transparent)]">
                    This challenge expires at {new Date(challengeExpiresAt).toLocaleString()}.
                  </div>
                ) : null}

                {canAutoSign ? (
                  <Button
                    variant="glass"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const signed = await signChallenge(address, challengeMessage);
                        setSignature(signed);
                        setFeedback({
                          tone: 'info',
                          text: 'A wallet signature was captured. Submit verification to link the wallet to the Phase 2 protected app.',
                        });
                        toast.success('Signature captured from wallet');
                      } catch (error) {
                        setFeedback({
                          tone: 'error',
                          text: error instanceof Error ? error.message : 'Wallet signing failed',
                        });
                        toast.error(error instanceof Error ? error.message : 'Wallet signing failed');
                      }
                    }}
                  >
                    Sign with wallet
                  </Button>
                ) : null}

                <Input
                  value={signature}
                  onChange={event => setSignature(event.target.value)}
                  placeholder="Paste wallet signature"
                  className="h-12 border-[var(--card-border)] bg-[color-mix(in_srgb,var(--bg)_32%,var(--card-bg))] text-[var(--text)]"
                />

                <Button
                  variant="brand"
                  className="w-full"
                  disabled={verifyMutation.isPending || !signature.trim()}
                  onClick={async () => {
                    if (!activeChallengeId) {
                      return;
                    }

                    try {
                      await verifyMutation.mutateAsync({
                        challengeId: activeChallengeId,
                        signature,
                      });

                      toast.success('Wallet verified');
                      setFeedback({
                        tone: 'success',
                        text: 'Wallet verified successfully. It is now available for protected purchase intents.',
                      });
                      setAddress('');
                      setSignature('');
                      setActiveChallengeId(null);
                      setChallengeMessage('');
                      setChallengeExpiresAt(null);
                    } catch (error) {
                      setFeedback({
                        tone: 'error',
                        text: error instanceof Error ? error.message : 'Wallet verification failed',
                      });
                      toast.error(error instanceof Error ? error.message : 'Wallet verification failed');
                    }
                  }}
                >
                  {verifyMutation.isPending ? 'Verifying...' : 'Verify wallet'}
                </Button>
              </div>
            ) : null}
          </div>
        </GlassPanel>

        <GlassPanel className="overflow-hidden">
          <div className="border-b border-[var(--card-border)] px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
            Linked Wallets
          </div>
          <div>
            {walletsQuery.isError ? (
              <div className="px-6 py-5 text-sm text-rose-200">
                {walletsQuery.error instanceof Error ? walletsQuery.error.message : 'Could not load linked wallets.'}
              </div>
            ) : null}

            {wallets.map(wallet => (
              <div
                key={wallet.id}
                className="flex flex-col gap-4 border-b border-[var(--card-border)] px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-[var(--text)]">{wallet.chain}</div>
                  <div className="mt-1 text-sm text-[color-mix(in_srgb,var(--text)_45%,transparent)]">{wallet.address}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-cyan-200">{wallet.isPrimary ? 'Primary' : 'Linked'}</div>
                  <Button
                    variant="glass"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      try {
                        await deleteMutation.mutateAsync(wallet.id);
                        setFeedback({
                          tone: 'success',
                          text: 'Wallet removed from the protected app surface.',
                        });
                        toast.success('Wallet removed');
                      } catch (error) {
                        setFeedback({
                          tone: 'error',
                          text: error instanceof Error ? error.message : 'Could not remove wallet',
                        });
                        toast.error(error instanceof Error ? error.message : 'Could not remove wallet');
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            {walletsQuery.isLoading ? (
              <div className="px-6 py-5 text-sm text-[var(--muted)]">Loading linked wallets...</div>
            ) : null}

            {!walletsQuery.isLoading && wallets.length === 0 ? (
              <div className="space-y-4 px-6 py-5">
                <p className="text-sm text-[var(--muted)]">
                  No wallets linked yet. Create a challenge on the left to begin, then continue into the protected buy flow once verification completes.
                </p>
                <Button variant="glass" asChild>
                  <Link href="/app/buy">Go to buy after linking</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

async function signChallenge(address: string, message: string) {
  const win = window as Window & {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  };

  if (!win.ethereum?.request) {
    throw new Error('Ethereum wallet provider is not available in this browser');
  }

  await win.ethereum.request({ method: 'eth_requestAccounts' });
  const signature = await win.ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  });

  if (typeof signature !== 'string') {
    throw new Error('Wallet provider did not return a signature');
  }

  return signature;
}
