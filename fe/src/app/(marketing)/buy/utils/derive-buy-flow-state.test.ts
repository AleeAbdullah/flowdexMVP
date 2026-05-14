import { describe, expect, it } from 'vitest';
import type {
  MarketingWalletCheckoutState,
  MarketingWalletProviderState,
  MarketingWalletVerificationState,
} from '@/hooks/marketing-wallet.types';
import { deriveBuyFlowState } from './derive-buy-flow-state';

function baseProviderState(): MarketingWalletProviderState {
  return {
    status: 'connected',
    address: '0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db',
    chainId: 84532,
    connectorKind: 'injected',
    connectorName: 'metamask',
    walletConnectTopic: null,
    executionReadiness: 'ready',
    unsupportedReason: null,
    availableConnectorNames: ['metamask'],
    pendingConnectorName: null,
    connectionErrorCode: null,
    connectionErrorMessage: null,
    autoReconnectSuppressed: false,
  };
}

function baseVerificationState(): MarketingWalletVerificationState {
  return {
    status: 'verified',
    walletAddress: '0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db',
    chainId: 84532,
    error: null,
  };
}

function baseCheckoutState(): MarketingWalletCheckoutState {
  return {
    selectedAssetId: 'ETH:BASE_SEPOLIA',
    amountDisplay: '0.25',
    submission: 'idle',
    simulation: null,
    receiptPublicId: null,
    txHash: null,
    errorReason: null,
    errorMessage: null,
  };
}

describe('deriveBuyFlowState', () => {
  it('maps a connected provider with no verified session to unverified', () => {
    expect(deriveBuyFlowState({
      provider: baseProviderState(),
      verification: {
        ...baseVerificationState(),
        status: 'unverified',
        walletAddress: null,
        chainId: null,
      },
      checkout: baseCheckoutState(),
      providerChainMismatch: false,
    })).toEqual({
      flowState: 'unverified',
      issueReason: null,
    });
  });

  it('maps a verified wallet on the wrong chain to wrong_chain', () => {
    expect(deriveBuyFlowState({
      provider: baseProviderState(),
      verification: baseVerificationState(),
      checkout: baseCheckoutState(),
      providerChainMismatch: true,
    })).toEqual({
      flowState: 'wrong_chain',
      issueReason: 'wrongChain',
    });
  });

  it('maps unsupported wallet sessions before verification or submission', () => {
    expect(deriveBuyFlowState({
      provider: {
        ...baseProviderState(),
        executionReadiness: 'unsupported',
        unsupportedReason: 'missing_walletconnect_eth_sendTransaction',
      },
      verification: {
        ...baseVerificationState(),
        status: 'unverified',
        walletAddress: null,
        chainId: null,
      },
      checkout: baseCheckoutState(),
      providerChainMismatch: false,
    })).toEqual({
      flowState: 'unsupported_wallet',
      issueReason: 'unsupportedWallet',
    });
  });

  it('maps verified and chain-correct wallets to ready', () => {
    expect(deriveBuyFlowState({
      provider: baseProviderState(),
      verification: baseVerificationState(),
      checkout: baseCheckoutState(),
      providerChainMismatch: false,
    })).toEqual({
      flowState: 'ready',
      issueReason: null,
    });
  });

  it('does not mark Ethereum Sepolia as wrong chain when provider and payment chain match', () => {
    expect(deriveBuyFlowState({
      provider: {
        ...baseProviderState(),
        chainId: 11155111,
      },
      verification: {
        ...baseVerificationState(),
        chainId: 11155111,
      },
      checkout: {
        ...baseCheckoutState(),
        selectedAssetId: 'ETH:ETH_SEPOLIA',
      },
      providerChainMismatch: false,
    })).toEqual({
      flowState: 'ready',
      issueReason: null,
    });
  });

  it('keeps connection failures in disconnected instead of an infinite checking state', () => {
    expect(deriveBuyFlowState({
      provider: {
        ...baseProviderState(),
        status: 'disconnected',
        address: null,
        chainId: null,
        connectionErrorCode: 'connector_failed',
        connectionErrorMessage: 'Connector already connected.',
      },
      verification: {
        ...baseVerificationState(),
        status: 'unverified',
        walletAddress: null,
        chainId: null,
      },
      checkout: baseCheckoutState(),
      providerChainMismatch: false,
    })).toEqual({
      flowState: 'disconnected',
      issueReason: 'connectionFailed',
    });
  });
});
