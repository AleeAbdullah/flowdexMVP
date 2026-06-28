import { describe, expect, it } from 'vitest';
import { getBuyExecutionReadiness } from './get-buy-execution-readiness';
import type { BuyProviderAccountSnapshot } from './buy-transaction.types';

const disconnectedProviderAccount = {
  isConnected: false,
  connector: undefined,
} as BuyProviderAccountSnapshot;

describe('getBuyExecutionReadiness', () => {
  it('keeps SOL wallet checkout manual-only when direct-send is supported', async () => {
    await expect(getBuyExecutionReadiness({
      asset: 'SOL',
      chain: 'SOLANA',
      selectedCheckoutMode: 'wallet',
      providerAccount: disconnectedProviderAccount,
      requiredChainId: null,
    })).resolves.toEqual({ status: 'manual_only' });
  });

  it('keeps BTC wallet checkout manual-only when direct-send is supported', async () => {
    await expect(getBuyExecutionReadiness({
      asset: 'BTC',
      chain: 'BITCOIN',
      selectedCheckoutMode: 'wallet',
      providerAccount: disconnectedProviderAccount,
      requiredChainId: null,
    })).resolves.toEqual({ status: 'manual_only' });
  });

  it('returns wallet_not_connected for ETH wallet checkout without a connected provider', async () => {
    await expect(getBuyExecutionReadiness({
      asset: 'ETH',
      chain: 'ETHEREUM',
      selectedCheckoutMode: 'wallet',
      providerAccount: disconnectedProviderAccount,
      requiredChainId: 1,
    })).resolves.toEqual({ status: 'wallet_not_connected' });
  });
});
