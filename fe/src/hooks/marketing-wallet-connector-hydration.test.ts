import { describe, expect, it, vi } from 'vitest';
import { readAuthorizedInjectedConnector } from './marketing-wallet-connector-hydration';

function createConnector(input: {
  name: string;
  accounts?: unknown;
  chainIdHex?: string | null;
}) {
  return {
    id: input.name,
    name: input.name,
    getProvider: vi.fn().mockResolvedValue({
      request: vi.fn().mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return input.accounts ?? [];
        }

        if (method === 'eth_chainId') {
          return input.chainIdHex ?? null;
        }

        return null;
      }),
    }),
  } as {
    id: string;
    name: string;
    getProvider: () => Promise<{ request: (args: { method: string }) => Promise<unknown> }>;
  };
}

describe('readAuthorizedInjectedConnector', () => {
  it('returns the first authorized injected connector', async () => {
    const connector = createConnector({
      name: 'MetaMask',
      accounts: ['0x1111111111111111111111111111111111111111'],
      chainIdHex: '0xaa36a7',
    });

    const result = await readAuthorizedInjectedConnector({
      connectors: [connector],
    });

    expect(result).toEqual({
      connector,
      connectorName: 'metamask',
      chainId: 11155111,
    });
  });

  it('ignores WalletConnect and unauthorized injected connectors', async () => {
    const walletConnect = createConnector({
      name: 'walletconnect',
      accounts: ['0x1111111111111111111111111111111111111111'],
      chainIdHex: '0xaa36a7',
    });
    const coinbase = createConnector({
      name: 'Coinbase Wallet',
      accounts: [],
    });

    const result = await readAuthorizedInjectedConnector({
      connectors: [walletConnect, coinbase],
    });

    expect(result).toBeNull();
  });
});
