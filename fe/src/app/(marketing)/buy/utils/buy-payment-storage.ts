import type { ActivePaymentView } from '../types/buy-view-model';
import type { IPaymentCheckoutSession } from '@/dal/app/payments/payments.types';
import type { WalletTxResult } from '../types/checkout-wallet.types';

const ACTIVE_PAYMENT_STORAGE_KEY = 'flowdex.activePaymentIntent.v1';
const CHECKOUT_RECOVERY_STORAGE_KEY = 'flowdex.walletCheckoutRecovery.v1';

type WalletCheckoutRecovery = {
  session: IPaymentCheckoutSession;
  txResult: WalletTxResult | null;
};

export function readStoredActivePayment(): ActivePaymentView | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_PAYMENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as ActivePaymentView;
    return parsed.intent?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredActivePayment(payment: ActivePaymentView | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!payment) {
    window.sessionStorage.removeItem(ACTIVE_PAYMENT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(ACTIVE_PAYMENT_STORAGE_KEY, JSON.stringify(payment));
}

export function readStoredWalletCheckoutRecovery(): WalletCheckoutRecovery | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_RECOVERY_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as WalletCheckoutRecovery;
    return parsed.session?.intent?.id && parsed.session.checkoutToken ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredWalletCheckoutRecovery(recovery: WalletCheckoutRecovery | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!recovery) {
    window.sessionStorage.removeItem(CHECKOUT_RECOVERY_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(CHECKOUT_RECOVERY_STORAGE_KEY, JSON.stringify(recovery));
}
