import { describe, expect, it, vi } from 'vitest';
import type { GetAccountReturnType } from '@wagmi/core';
import { getBuyExecutionReadiness } from './get-buy-execution-readiness';

function createProviderAccount(input: {
  connectorName: string;
  address?: `0x${string}`;
  chainId?: number;
  provider: unknown;
}): GetAccountReturnType {
  return {
    address: input.address ?? '0x1111111111111111111111111111111111111111',
    addresses: [input.address ?? '0x1111111111111111111111111111111111111111'],
    chain: undefined,
    chainId: input.chainId ?? 11155111,
    connector: {
      id: input.connectorName,
      name: input.connectorName,
      getProvider: vi.fn().mockResolvedValue(input.provider),
    },
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
    isReconnecting: false,
    status: 'connected',
  } as unknown as GetAccountReturnType;
}

describe('getBuyExecutionReadiness', () => {
  it('marks supported injected wallets as ready', async () => {
    const readiness = await getBuyExecutionReadiness({
      providerAccount: createProviderAccount({
        connectorName: 'MetaMask',
        provider: { request: vi.fn() },
      }),
      requiredChainId: 11155111,
    });

    expect(readiness).toEqual({
      status: 'ready',
      sendMode: 'provider_send_transaction',
      walletKind: 'injected',
      supportsSwitchChain: true,
      capabilityKey: null,
    });
  });

  it('blocks WalletConnect sessions that do not approve eth_sendTransaction', async () => {
    const readiness = await getBuyExecutionReadiness({
      providerAccount: createProviderAccount({
        connectorName: 'walletconnect',
        provider: {
          request: vi.fn(),
          session: {
            topic: 'wc-topic',
            namespaces: {
              eip155: {
                methods: ['personal_sign'],
                accounts: ['eip155:11155111:0x1111111111111111111111111111111111111111'],
              },
            },
          },
        },
      }),
      requiredChainId: 11155111,
    });

    expect(readiness).toEqual({
      status: 'unsupported',
      reason: 'missing_walletconnect_eth_sendTransaction',
      walletKind: 'walletconnect',
      capabilityKey: 'wc-topic',
    });
  });
});
