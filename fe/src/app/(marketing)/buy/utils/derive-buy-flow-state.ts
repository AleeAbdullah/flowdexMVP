import type {
  MarketingWalletCheckoutState,
  MarketingWalletProviderState,
  MarketingWalletVerificationState,
} from '@/hooks/marketing-wallet.types';
import type { BuyFlowState, BuyIssueReason } from '../types/buy-view-model';

function mapCheckoutErrorReason(reason: string | null): BuyIssueReason | null {
  switch (reason) {
    case 'connection_canceled':
      return 'connectionCanceled';
    case 'connection_failed':
      return 'connectionFailed';
    case 'unsupported_wallet':
      return 'unsupportedWallet';
    case 'verification_failed':
      return 'verificationFailed';
    case 'wrong_chain':
      return 'wrongChain';
    case 'simulate_failed':
      return 'simulateFailed';
    case 'send_canceled':
      return 'sendCanceled';
    case 'send_failed':
      return 'sendFailed';
    case 'track_failed':
      return 'trackFailed';
    default:
      return null;
  }
}

export function deriveBuyFlowState(input: {
  provider: MarketingWalletProviderState;
  verification: MarketingWalletVerificationState;
  checkout: MarketingWalletCheckoutState;
  providerChainMismatch: boolean;
}) {
  const issueReason: BuyIssueReason | null = input.provider.status === 'disconnected'
    ? input.provider.connectionErrorCode === 'user_rejected'
      ? 'connectionCanceled'
      : input.provider.connectionErrorMessage
        ? 'connectionFailed'
        : null
    : input.provider.executionReadiness === 'unsupported'
      ? 'unsupportedWallet'
      : input.providerChainMismatch
        ? 'wrongChain'
        : input.verification.status === 'unverified' && input.verification.error
          ? 'verificationFailed'
          : mapCheckoutErrorReason(input.checkout.errorReason);

  const flowState: BuyFlowState = input.provider.status === 'disconnected'
    ? 'disconnected'
    : input.provider.status === 'checking' || input.provider.executionReadiness === 'checking'
      ? 'checking_wallet'
      : input.provider.executionReadiness === 'unsupported'
        ? 'unsupported_wallet'
        : input.providerChainMismatch
          ? 'wrong_chain'
          : input.verification.status !== 'verified'
            ? 'unverified'
            : input.checkout.submission === 'simulating'
              || input.checkout.submission === 'awaiting_wallet_approval'
              || input.checkout.submission === 'tracking'
              ? 'submitting'
              : input.checkout.submission === 'success'
                ? 'success'
                : input.checkout.submission === 'failed'
                  ? 'failed'
                  : 'ready';

  return {
    flowState,
    issueReason,
  };
}
