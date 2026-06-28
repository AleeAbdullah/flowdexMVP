import type { BuyCheckoutStage } from '../types/buy-view-model';

export function getInitialCheckoutStage(input: {
  hasActivePayment: boolean;
  canUseWalletCheckout: boolean;
}): BuyCheckoutStage {
  if (input.hasActivePayment) {
    return 'direct_instructions';
  }

  return input.canUseWalletCheckout ? 'choose_method' : 'direct_address';
}

export function shouldRenderWalletConnectionStatus(address: string | null) {
  return Boolean(address);
}
