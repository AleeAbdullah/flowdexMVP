import { extractAxiosError, STATUS_CODES } from '../../../../lib/axios';

const SOLANA_WALLET_CHECKOUT_UNAVAILABLE = 'SOLANA_WALLET_CHECKOUT_UNAVAILABLE';
const SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE = 'Solana wallet checkout is temporarily unavailable. Please try again later.';

export type CheckoutErrorView = {
  title: string;
  message: string;
  variant: 'error' | 'warning';
};

export function getCheckoutErrorMessage(error: unknown): CheckoutErrorView {
  const apiError = extractAxiosError(error);
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

  return {
    title: 'Checkout failed',
    message: 'Something went wrong while preparing your checkout. Please try again.',
    variant: 'error',
  };
}
