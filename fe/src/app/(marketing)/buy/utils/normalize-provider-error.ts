import { BuyTransactionValidationError } from './buy-transaction-validation';
import type { NormalizedBuySendError } from './buy-transaction.types';

function extractErrorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'number' || typeof code === 'string') {
      return code;
    }
  }

  return undefined;
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? 'Unknown wallet send error.');
}

export function normalizeProviderError(error: unknown): NormalizedBuySendError {
  if (error instanceof BuyTransactionValidationError) {
    const mappedReason = error.reason === 'missing_provider'
      ? 'provider_disconnected'
      : error.reason;

    return {
      reason: mappedReason,
      message: error.message,
      originalCode: error.originalCode,
    };
  }

  const originalCode = extractErrorCode(error);
  const message = extractErrorMessage(error);
  const lowered = message.toLowerCase();

  if (
    originalCode === 4001
    || lowered.includes('rejected')
    || lowered.includes('denied')
    || lowered.includes('declined')
    || lowered.includes('cancel')
  ) {
    return {
      reason: 'user_rejected',
      message: 'The transaction request was canceled in the wallet.',
      originalCode,
    };
  }

  if (
    originalCode === 4900
    || lowered.includes('disconnected')
    || lowered.includes('provider disconnected')
  ) {
    return {
      reason: 'provider_disconnected',
      message: 'The wallet disconnected before the transaction could be sent.',
      originalCode,
    };
  }

  if (
    originalCode === 4901
    || lowered.includes('chain disconnected')
    || lowered.includes('wrong network')
  ) {
    return {
      reason: 'wrong_chain',
      message: 'The connected wallet is on the wrong network for this checkout.',
      originalCode,
    };
  }

  if (
    originalCode === 4200
    || lowered.includes('unsupported method')
    || lowered.includes('method not found')
    || lowered.includes('eth_sendtransaction')
  ) {
    return {
      reason: 'unsupported_method',
      message: 'This wallet does not support sending checkout transactions on this route.',
      originalCode,
    };
  }

  if (lowered.includes('insufficient funds')) {
    return {
      reason: 'insufficient_funds',
      message: 'The connected wallet does not have enough ETH to cover this contribution and gas.',
      originalCode,
    };
  }

  if (
    lowered.includes('rpc')
    || lowered.includes('internal error')
    || lowered.includes('execution reverted')
    || lowered.includes('nonce')
  ) {
    return {
      reason: 'rpc_error',
      message,
      originalCode,
    };
  }

  return {
    reason: 'unknown_send_error',
    message,
    originalCode,
  };
}
