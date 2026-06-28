import { extractAxiosError, STATUS_CODES } from '../../../../lib/axios';
import type { PaymentChain } from '@/dal/app/payments/payments.types';

const SOLANA_WALLET_CHECKOUT_UNAVAILABLE = 'SOLANA_WALLET_CHECKOUT_UNAVAILABLE';
const SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE = 'Solana wallet checkout is temporarily unavailable. Please try again later.';

export type CheckoutFailureStep =
  | 'create_intent'
  | 'prepare_wallet_action'
  | 'wallet_approval'
  | 'submit_tx_result'
  | 'status_poll';

export type CheckoutErrorView = {
  title: string;
  message: string;
  variant: 'error' | 'warning';
};

export class CheckoutStepError extends Error {
  readonly step: CheckoutFailureStep;

  readonly chain: PaymentChain;

  readonly originalError: unknown;

  constructor(step: CheckoutFailureStep, chain: PaymentChain, originalError: unknown) {
    super(getUnknownErrorMessage(originalError));
    this.name = 'CheckoutStepError';
    this.step = step;
    this.chain = chain;
    this.originalError = originalError;
  }
}

export function toCheckoutStepError(
  step: CheckoutFailureStep,
  chain: PaymentChain,
  error: unknown,
) {
  if (error instanceof CheckoutStepError) {
    return error;
  }

  return new CheckoutStepError(step, chain, error);
}

export function getCheckoutErrorMessage(error: unknown): CheckoutErrorView {
  const stepError = error instanceof CheckoutStepError ? error : null;
  const sourceError = stepError?.originalError ?? error;
  const apiError = extractAxiosError(sourceError);
  const statusCode = apiError.statusCode ?? apiError.status;

  if (apiError.code === SOLANA_WALLET_CHECKOUT_UNAVAILABLE) {
    return {
      title: 'Solana wallet checkout unavailable',
      message: SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE,
      variant: 'warning',
    };
  }

  if (statusCode === STATUS_CODES.SERVICE_UNAVAILABLE) {
    return {
      title: 'Wallet checkout temporarily unavailable',
      message: 'Wallet checkout is temporarily unavailable. Please try again later.',
      variant: 'warning',
    };
  }

  if (stepError) {
    return getCheckoutStepErrorMessage(stepError);
  }

  return {
    title: 'Checkout failed',
    message: 'Something went wrong while preparing your checkout. Please try again.',
    variant: 'error',
  };
}

function getCheckoutStepErrorMessage(error: CheckoutStepError): CheckoutErrorView {
  if (error.step === 'create_intent') {
    return {
      title: 'Checkout failed',
      message: 'Could not start this payment. Please try again.',
      variant: 'error',
    };
  }

  if (error.step === 'prepare_wallet_action') {
    return {
      title: 'Preparing checkout failed',
      message: 'Could not prepare this checkout. Please try again.',
      variant: 'error',
    };
  }

  if (error.step === 'wallet_approval' && error.chain === 'SOLANA') {
    if (isUserRejectedError(error.originalError)) {
      return {
        title: 'Solana wallet approval failed',
        message: 'Transaction was rejected in your wallet.',
        variant: 'error',
      };
    }

    if (isSolanaChainError(error.originalError)) {
      return {
        title: 'Solana wallet approval failed',
        message: 'Your Solana wallet could not send on the expected network. Please reconnect MetaMask Solana and try again.',
        variant: 'error',
      };
    }

    return {
      title: 'Solana wallet approval failed',
      message: 'Solana wallet approval failed. Please try again.',
      variant: 'error',
    };
  }

  if (error.step === 'wallet_approval') {
    return {
      title: 'Wallet approval failed',
      message: 'The transaction was not approved or could not be sent from your wallet.',
      variant: 'error',
    };
  }

  if (error.step === 'submit_tx_result') {
    return {
      title: 'Submitting transaction failed',
      message: 'Your wallet transaction may have been sent, but FlowDex could not attach it to this payment. Please try again.',
      variant: 'error',
    };
  }

  return {
    title: 'Payment status delayed',
    message: 'Payment submitted, but the status update is delayed. Please check again shortly.',
    variant: 'warning',
  };
}

function getUnknownErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Checkout step failed';
}

function getErrorText(error: unknown) {
  return getUnknownErrorMessage(error).toLowerCase();
}

function isUserRejectedError(error: unknown) {
  const message = getErrorText(error);
  return message.includes('reject')
    || message.includes('cancel')
    || message.includes('decline')
    || message.includes('denied');
}

function isSolanaChainError(error: unknown) {
  const message = getErrorText(error);
  return message.includes('unsupported solana wallet chain')
    || message.includes('expected network')
    || message.includes('wrong chain')
    || message.includes('wrong network');
}
