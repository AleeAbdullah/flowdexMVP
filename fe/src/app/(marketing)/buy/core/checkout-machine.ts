import type { IPaymentCheckoutSession, IPaymentIntentStatusResponse } from '@/dal/app/payments/payments.types';
import type { WalletTxResult } from '../types/checkout-wallet.types';

type WalletCheckoutStage =
  | 'closed'
  | 'connecting_wallet'
  | 'wallet_ready'
  | 'preparing_wallet_action'
  | 'waiting_for_wallet_approval'
  | 'submitting_tx_result'
  | 'tracking'
  | 'failed';

type WalletCheckoutState = {
  stage: WalletCheckoutStage;
  session: IPaymentCheckoutSession | null;
  txResult: WalletTxResult | null;
  error: string | null;
};

type WalletCheckoutEvent =
  | { type: 'CONNECTING' }
  | { type: 'WALLET_READY' }
  | { type: 'PREPARING' }
  | { type: 'SESSION_CREATED'; session: IPaymentCheckoutSession }
  | { type: 'AWAITING_APPROVAL' }
  | { type: 'TX_BROADCAST'; txResult: WalletTxResult }
  | { type: 'TRACKING'; status: IPaymentIntentStatusResponse }
  | { type: 'RESUME_TRACKING' }
  | { type: 'STATUS_UPDATED'; status: IPaymentIntentStatusResponse }
  | { type: 'RESTORE'; session: IPaymentCheckoutSession; txResult: WalletTxResult | null }
  | { type: 'FAILED'; error: string }
  | { type: 'CLOSE' }
  | { type: 'RESET' };

export const initialWalletCheckoutState: WalletCheckoutState = {
  stage: 'closed',
  session: null,
  txResult: null,
  error: null,
};

export function walletCheckoutReducer(
  state: WalletCheckoutState,
  event: WalletCheckoutEvent,
): WalletCheckoutState {
  switch (event.type) {
    case 'CONNECTING':
      return { ...state, stage: 'connecting_wallet', error: null };
    case 'WALLET_READY':
      return { ...state, stage: 'wallet_ready', error: null };
    case 'PREPARING':
      return { ...state, stage: 'preparing_wallet_action', error: null };
    case 'SESSION_CREATED':
      return { ...state, stage: 'preparing_wallet_action', session: event.session, txResult: null, error: null };
    case 'AWAITING_APPROVAL':
      return { ...state, stage: 'waiting_for_wallet_approval' };
    case 'TX_BROADCAST':
      return { ...state, stage: 'submitting_tx_result', txResult: event.txResult };
    case 'TRACKING':
      return {
        ...state,
        stage: 'tracking',
        session: { ...state.session!, intent: event.status.intent },
        error: null,
      };
    case 'RESUME_TRACKING':
      return { ...state, stage: 'tracking', error: null };
    case 'STATUS_UPDATED':
      return state.session
        ? { ...state, session: { ...state.session, intent: event.status.intent } }
        : state;
    case 'RESTORE':
      return { ...state, session: event.session, txResult: event.txResult, error: null };
    case 'FAILED':
      return { ...state, stage: 'failed', error: event.error };
    case 'CLOSE':
      return { ...state, stage: 'closed', error: null };
    case 'RESET':
      return initialWalletCheckoutState;
  }
}
