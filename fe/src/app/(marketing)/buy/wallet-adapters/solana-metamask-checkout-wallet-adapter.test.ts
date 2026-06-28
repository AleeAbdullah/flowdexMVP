import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSolanaMetaMaskCheckoutWalletAdapter,
  initialSolanaCheckoutWalletAdapterState,
  type SolanaCheckoutWalletAdapterState,
} from './solana-metamask-checkout-wallet-adapter';
import type { PreparedWalletAction } from '../types/checkout-wallet.types';

const connect = vi.fn();
const signAndSendTransaction = vi.fn();
const disconnect = vi.fn();

vi.mock('@metamask/connect-solana', () => ({
  createSolanaClient: vi.fn(async () => ({
    getWallet: () => ({
      features: {
        'standard:connect': { connect },
        'standard:disconnect': { disconnect },
        'solana:signAndSendTransaction': { signAndSendTransaction },
      },
    }),
  })),
}));

vi.mock('@/dal/app/wallet-auth/wallet-auth.services', () => ({
  walletAuthService: {
    createChallenge: vi.fn(),
    verify: vi.fn(),
  },
}));

function buildAdapter() {
  let state: SolanaCheckoutWalletAdapterState = initialSolanaCheckoutWalletAdapterState;
  return {
    adapter: createSolanaMetaMaskCheckoutWalletAdapter({
      getState: () => state,
      setState: next => {
        state = next;
      },
    }),
    getState: () => state,
  };
}

function buildSolanaAction(overrides: Partial<PreparedWalletAction> = {}): PreparedWalletAction {
  return {
    kind: 'solana_transaction',
    paymentIntentId: 'intent-id',
    preparedActionId: 'prepared-action-id',
    chain: 'SOLANA',
    cluster: 'mainnet-beta',
    walletChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    payer: '4Nd1mVtA6Htd7qgrJQYzT8YhP76jYwgyhdjgq2scLqEL',
    transaction: btoa('serialized-solana-transaction'),
    transactionEncoding: 'base64',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    lastValidBlockHeight: 123,
    ...overrides,
  } as PreparedWalletAction;
}

describe('solana metamask checkout wallet adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connect.mockResolvedValue({
      accounts: [{
        address: '4Nd1mVtA6Htd7qgrJQYzT8YhP76jYwgyhdjgq2scLqEL',
        chains: ['solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'],
      }],
    });
    signAndSendTransaction.mockResolvedValue([{ signature: new Uint8Array(Array.from({ length: 64 }, (_, index) => index + 1)) }]);
  });

  it('connects to MetaMask Solana and marks sign-and-send as ready', async () => {
    const { adapter, getState } = buildAdapter();

    await adapter.connect();

    expect(getState()).toMatchObject({
      address: '4Nd1mVtA6Htd7qgrJQYzT8YhP76jYwgyhdjgq2scLqEL',
      walletChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
      isConnected: true,
      isReady: true,
    });
  });

  it('rejects expired Solana prepared actions', async () => {
    const { adapter } = buildAdapter();
    await adapter.connect();

    await expect(adapter.sendPreparedAction(buildSolanaAction({
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    }))).rejects.toThrow('Prepared Solana transaction expired');
  });

  it('decodes base64 transaction bytes and returns a Solana signature result', async () => {
    const { adapter } = buildAdapter();
    await adapter.connect();

    const result = await adapter.sendPreparedAction(buildSolanaAction());

    expect(signAndSendTransaction).toHaveBeenCalledWith(expect.objectContaining({
      transaction: new Uint8Array(Array.from('serialized-solana-transaction', char => char.charCodeAt(0))),
      chain: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    }));
    expect(result).toMatchObject({
      paymentIntentId: 'intent-id',
      preparedActionId: 'prepared-action-id',
      chain: 'SOLANA',
      txIdKind: 'solana_signature',
    });
    expect(result.txId).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
  });
});
