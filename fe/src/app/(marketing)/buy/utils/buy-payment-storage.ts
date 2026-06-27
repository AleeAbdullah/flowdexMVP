import type { ActivePaymentView } from '../types/buy-view-model';

const ACTIVE_PAYMENT_STORAGE_KEY = 'flowdex.activePaymentIntent.v1';

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
