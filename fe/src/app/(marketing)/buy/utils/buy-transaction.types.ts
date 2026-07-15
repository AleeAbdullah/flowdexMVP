import type { MarketingWalletUnsupportedReason } from '@/hooks/marketing-wallet.types';

export type UnsupportedReason = MarketingWalletUnsupportedReason;

export type EvmExecutionReadiness =
  | { status: 'checking' }
  | {
      status: 'ready';
      sendMode: 'provider_send_transaction';
      walletKind: 'injected';
      supportsSwitchChain: boolean;
      capabilityKey: string | null;
    }
  | {
      status: 'unsupported';
      reason: UnsupportedReason;
      walletKind: 'injected' | null;
      capabilityKey: string | null;
    };

export type BuySendErrorReason =
  | 'user_rejected'
  | 'provider_disconnected'
  | 'wrong_chain'
  | 'account_mismatch'
  | 'unsupported_method'
  | 'insufficient_funds'
  | 'rpc_error'
  | 'unknown_send_error';

export type NormalizedBuySendError = {
  reason: BuySendErrorReason;
  message: string;
  originalCode?: number | string;
};

export type BuyWalletProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};
