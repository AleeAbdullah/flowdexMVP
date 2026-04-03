'use client';

import { useMemo, useState } from 'react';
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

type Chain = 'ETH' | 'ERC20' | 'TRC20';

export function WalletsPage() {
  const walletsQuery = useWallets();
  const challengeMutation = useCreateWalletChallenge();
  const verifyMutation = useVerifyWalletSignature();
  const deleteMutation = useDeleteWallet();

  const [chain, setChain] = useState<Chain>('ETH');
  const [address, setAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('');

  const wallets = walletsQuery.data?.items ?? [];
  const canAutoSign = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    const win = window as Window & {
      ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
      tronWeb?: { trx?: { signMessageV2?: (message: string) => Promise<string> } };
    };

    return chain === 'TRC20'
      ? Boolean(win.tronWeb?.trx?.signMessageV2)
      : Boolean(win.ethereum?.request);
  }, [chain]);

  return (
    <div className="space-y-8">
      <GlassPanel className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <SectionHeading
          eyebrow="Wallets"
          title="Link the wallet that will anchor protected presale actions."
          description="Challenge creation and signature verification are delegated to the backend. This surface orchestrates the chain choice, signing step, and wallet list refresh."
        />
        <div className="space-y-4 rounded-[1.5rem] border border-cyan-400/12 bg-cyan-400/6 p-5">
          <div className="text-[10px] font-bold tracking-[0.28em] text-cyan-300 uppercase">Flow</div>
          <ol className="space-y-3 text-sm leading-7 text-slate-200">
            <li>1. Choose the target chain and wallet address.</li>
            <li>2. Request a backend challenge bound to your user and address.</li>
            <li>3. Sign it in the wallet or paste the signature manually.</li>
            <li>4. Verify and refresh the protected wallet list.</li>
          </ol>
        </div>
      </GlassPanel>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassPanel className="p-6">
          <div className="space-y-4">
            <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Link Wallet</div>

            <div className="flex flex-wrap gap-2">
              {(['ETH', 'ERC20', 'TRC20'] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setChain(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${chain === option ? 'bg-cyan-400 text-slate-950' : 'border border-white/8 bg-white/4 text-slate-300'}`}
                >
                  {option}
                </button>
              ))}
            </div>

            <Input
              value={address}
              onChange={event => setAddress(event.target.value)}
              placeholder={chain === 'TRC20' ? 'TRON address' : '0x wallet address'}
              className="h-12 border-white/10 bg-white/5 text-white"
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
                  setSignature('');
                  toast.success('Challenge created');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Could not create challenge');
                }
              }}
            >
              {challengeMutation.isPending ? 'Creating challenge...' : 'Create challenge'}
            </Button>

            {activeChallengeId ? (
              <div className="space-y-4 rounded-[1.25rem] border border-white/8 bg-white/4 p-4">
                <div className="text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">Challenge Message</div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-slate-200">{challengeMessage}</pre>

                {canAutoSign ? (
                  <Button
                    variant="glass"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const signed = await signChallenge(chain, address, challengeMessage);
                        setSignature(signed);
                        toast.success('Signature captured from wallet');
                      } catch (error) {
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
                  className="h-12 border-white/10 bg-[#071423] text-white"
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
                      setAddress('');
                      setSignature('');
                      setActiveChallengeId(null);
                      setChallengeMessage('');
                    } catch (error) {
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
          <div className="border-b border-white/8 px-6 py-4 text-[10px] font-bold tracking-[0.28em] text-slate-500 uppercase">
            Linked Wallets
          </div>
          <div>
            {wallets.map(wallet => (
              <div
                key={wallet.id}
                className="flex flex-col gap-4 border-b border-white/6 px-6 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-white">{wallet.chain}</div>
                  <div className="mt-1 text-sm text-slate-400">{wallet.address}</div>
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
                        toast.success('Wallet removed');
                      } catch (error) {
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
              <div className="px-6 py-5 text-sm text-slate-300">Loading linked wallets...</div>
            ) : null}

            {!walletsQuery.isLoading && wallets.length === 0 ? (
              <div className="px-6 py-5 text-sm text-slate-300">
                No wallets linked yet. Create a challenge on the left to begin.
              </div>
            ) : null}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

async function signChallenge(chain: Chain, address: string, message: string) {
  const win = window as Window & {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
    tronWeb?: { trx?: { signMessageV2?: (payload: string) => Promise<string> } };
  };

  if (chain === 'TRC20') {
    const signer = win.tronWeb?.trx?.signMessageV2;

    if (!signer) {
      throw new Error('TRON wallet signer is not available in this browser');
    }

    return signer(message);
  }

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
