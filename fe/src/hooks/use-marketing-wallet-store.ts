'use client';

import { create } from 'zustand';
import type {
  MarketingWalletCheckoutErrorReason,
  MarketingWalletCheckoutState,
  MarketingWalletConnectionErrorCode,
  MarketingWalletExecutionReadiness,
  MarketingWalletProviderState,
  MarketingWalletSubmissionStatus,
  MarketingWalletUnsupportedReason,
  MarketingWalletVerificationState,
} from './marketing-wallet.types';
import type { IWalletTransactionSimulationResult } from '@/dal/app/transactions/transactions.types';

const initialProviderState: MarketingWalletProviderState = {
  status: 'disconnected',
  address: null,
  chainId: null,
  connectorKind: null,
  connectorName: null,
  executionReadiness: 'checking',
  unsupportedReason: null,
  availableConnectorNames: [],
  pendingConnectorName: null,
  connectionErrorCode: null,
  connectionErrorMessage: null,
  autoReconnectSuppressed: false,
};

const initialVerificationState: MarketingWalletVerificationState = {
  status: 'unverified',
  walletAddress: null,
  chainId: null,
  error: null,
};

const initialCheckoutState: MarketingWalletCheckoutState = {
  selectedAssetId: null,
  amountDisplay: '',
  submission: 'idle',
  simulation: null,
  receiptPublicId: null,
  txHash: null,
  errorReason: null,
  errorMessage: null,
};

export type MarketingWalletStore = {
  provider: MarketingWalletProviderState;
  verification: MarketingWalletVerificationState;
  checkout: MarketingWalletCheckoutState;
  setProviderState: (input: Partial<MarketingWalletProviderState>) => void;
  setProviderExecutionState: (input: {
    executionReadiness: MarketingWalletExecutionReadiness;
    unsupportedReason?: MarketingWalletUnsupportedReason | null;
  }) => void;
  setProviderConnectionIssue: (input: {
    code: MarketingWalletConnectionErrorCode;
    message: string;
  } | null) => void;
  clearProviderConnectionIssue: () => void;
  setProviderAutoReconnectSuppressed: (value: boolean) => void;
  setVerificationState: (input: Partial<MarketingWalletVerificationState>) => void;
  resetVerificationState: () => void;
  setCheckoutSelectedAssetId: (value: string | null) => void;
  setCheckoutAmountDisplay: (value: string) => void;
  setCheckoutSubmissionState: (input: {
    submission: MarketingWalletSubmissionStatus;
    simulation?: IWalletTransactionSimulationResult | null;
    receiptPublicId?: string | null;
    txHash?: `0x${string}` | null;
    errorReason?: MarketingWalletCheckoutErrorReason | null;
    errorMessage?: string | null;
  }) => void;
  clearCheckoutLifecycle: () => void;
};

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function resetCheckoutLifecycle(checkout: MarketingWalletCheckoutState): MarketingWalletCheckoutState {
  return {
    ...checkout,
    submission: 'idle',
    simulation: null,
    receiptPublicId: null,
    txHash: null,
    errorReason: null,
    errorMessage: null,
  };
}

export const useMarketingWalletStore = create<MarketingWalletStore>((set) => ({
  provider: initialProviderState,
  verification: initialVerificationState,
  checkout: initialCheckoutState,
  setProviderState(input) {
    set((state) => {
      const nextProvider = {
        ...state.provider,
        ...input,
      };

      const providerUnchanged = state.provider.status === nextProvider.status
        && state.provider.address === nextProvider.address
        && state.provider.chainId === nextProvider.chainId
        && state.provider.connectorKind === nextProvider.connectorKind
        && state.provider.connectorName === nextProvider.connectorName
        && state.provider.executionReadiness === nextProvider.executionReadiness
        && state.provider.unsupportedReason === nextProvider.unsupportedReason
        && state.provider.pendingConnectorName === nextProvider.pendingConnectorName
        && state.provider.connectionErrorCode === nextProvider.connectionErrorCode
        && state.provider.connectionErrorMessage === nextProvider.connectionErrorMessage
        && state.provider.autoReconnectSuppressed === nextProvider.autoReconnectSuppressed
        && arraysEqual(state.provider.availableConnectorNames, nextProvider.availableConnectorNames);

      if (providerUnchanged) {
        return state;
      }

      return {
        ...state,
        provider: nextProvider,
      };
    });
  },
  setProviderExecutionState(input) {
    set((state) => {
      if (
        state.provider.executionReadiness === input.executionReadiness
        && state.provider.unsupportedReason === (input.unsupportedReason ?? null)
      ) {
        return state;
      }

      return {
        ...state,
        provider: {
          ...state.provider,
          executionReadiness: input.executionReadiness,
          unsupportedReason: input.unsupportedReason ?? null,
        },
      };
    });
  },
  setProviderConnectionIssue(input) {
    set((state) => {
      const nextCode = input?.code ?? null;
      const nextMessage = input?.message ?? null;
      const nextCheckout: MarketingWalletCheckoutState = input
        ? {
            ...state.checkout,
            errorReason: input.code === 'user_rejected' ? 'connection_canceled' : 'connection_failed',
            errorMessage: input.message,
          }
        : state.checkout;

      const checkoutUnchanged = nextCheckout === state.checkout
        || (
          state.checkout.selectedAssetId === nextCheckout.selectedAssetId
          && state.checkout.amountDisplay === nextCheckout.amountDisplay
          && state.checkout.submission === nextCheckout.submission
          && state.checkout.simulation === nextCheckout.simulation
          && state.checkout.receiptPublicId === nextCheckout.receiptPublicId
          && state.checkout.txHash === nextCheckout.txHash
          && state.checkout.errorReason === nextCheckout.errorReason
          && state.checkout.errorMessage === nextCheckout.errorMessage
        );

      if (
        state.provider.connectionErrorCode === nextCode
        && state.provider.connectionErrorMessage === nextMessage
        && checkoutUnchanged
      ) {
        return state;
      }

      return {
        ...state,
        provider: {
          ...state.provider,
          connectionErrorCode: nextCode,
          connectionErrorMessage: nextMessage,
        },
        checkout: nextCheckout,
      };
    });
  },
  clearProviderConnectionIssue() {
    set((state) => {
      const nextCheckout: MarketingWalletCheckoutState = state.checkout.errorReason === 'connection_canceled' || state.checkout.errorReason === 'connection_failed'
        ? {
            ...state.checkout,
            errorReason: null,
            errorMessage: null,
          }
        : state.checkout;

      if (
        state.provider.connectionErrorCode === null
        && state.provider.connectionErrorMessage === null
        && nextCheckout === state.checkout
      ) {
        return state;
      }

      return {
        ...state,
        provider: {
          ...state.provider,
          connectionErrorCode: null,
          connectionErrorMessage: null,
        },
        checkout: nextCheckout,
      };
    });
  },
  setProviderAutoReconnectSuppressed(value) {
    set((state) => {
      if (state.provider.autoReconnectSuppressed === value) {
        return state;
      }

      return {
        ...state,
        provider: {
          ...state.provider,
          autoReconnectSuppressed: value,
        },
      };
    });
  },
  setVerificationState(input) {
    set((state) => {
      const nextVerification = {
        ...state.verification,
        ...input,
      };

      if (
        state.verification.status === nextVerification.status
        && state.verification.walletAddress === nextVerification.walletAddress
        && state.verification.chainId === nextVerification.chainId
        && state.verification.error === nextVerification.error
      ) {
        return state;
      }

      return {
        ...state,
        verification: nextVerification,
      };
    });
  },
  resetVerificationState() {
    set((state) => {
      if (
        state.verification.status === initialVerificationState.status
        && state.verification.walletAddress === initialVerificationState.walletAddress
        && state.verification.chainId === initialVerificationState.chainId
        && state.verification.error === initialVerificationState.error
      ) {
        return state;
      }

      return {
        ...state,
        verification: initialVerificationState,
      };
    });
  },
  setCheckoutSelectedAssetId(value) {
    set((state) => {
      if (state.checkout.selectedAssetId === value) {
        return state;
      }

      return {
        ...state,
        checkout: resetCheckoutLifecycle({
          ...state.checkout,
          selectedAssetId: value,
        }),
      };
    });
  },
  setCheckoutAmountDisplay(value) {
    set((state) => {
      if (state.checkout.amountDisplay === value) {
        return state;
      }

      return {
        ...state,
        checkout: resetCheckoutLifecycle({
          ...state.checkout,
          amountDisplay: value,
        }),
      };
    });
  },
  setCheckoutSubmissionState(input) {
    set((state) => {
      const nextCheckout = {
        ...state.checkout,
        submission: input.submission,
        simulation: input.simulation ?? state.checkout.simulation,
        receiptPublicId: input.receiptPublicId ?? (input.submission === 'success' ? state.checkout.receiptPublicId : null),
        txHash: input.txHash ?? (input.submission === 'success' ? state.checkout.txHash : null),
        errorReason: input.errorReason ?? (input.submission === 'failed' ? state.checkout.errorReason : null),
        errorMessage: input.errorMessage ?? (input.submission === 'failed' ? state.checkout.errorMessage : null),
      };

      if (
        state.checkout.selectedAssetId === nextCheckout.selectedAssetId
        && state.checkout.amountDisplay === nextCheckout.amountDisplay
        && state.checkout.submission === nextCheckout.submission
        && state.checkout.simulation === nextCheckout.simulation
        && state.checkout.receiptPublicId === nextCheckout.receiptPublicId
        && state.checkout.txHash === nextCheckout.txHash
        && state.checkout.errorReason === nextCheckout.errorReason
        && state.checkout.errorMessage === nextCheckout.errorMessage
      ) {
        return state;
      }

      return {
        ...state,
        checkout: nextCheckout,
      };
    });
  },
  clearCheckoutLifecycle() {
    set((state) => {
      const nextCheckout = resetCheckoutLifecycle(state.checkout);
      if (
        state.checkout.selectedAssetId === nextCheckout.selectedAssetId
        && state.checkout.amountDisplay === nextCheckout.amountDisplay
        && state.checkout.submission === nextCheckout.submission
        && state.checkout.simulation === nextCheckout.simulation
        && state.checkout.receiptPublicId === nextCheckout.receiptPublicId
        && state.checkout.txHash === nextCheckout.txHash
        && state.checkout.errorReason === nextCheckout.errorReason
        && state.checkout.errorMessage === nextCheckout.errorMessage
      ) {
        return state;
      }

      return {
        ...state,
        checkout: nextCheckout,
      };
    });
  },
}));
