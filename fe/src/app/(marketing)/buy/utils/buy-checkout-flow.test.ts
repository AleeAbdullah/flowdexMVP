import { describe, expect, it } from 'vitest';
import { getInitialCheckoutStage, shouldRenderWalletConnectionStatus } from './buy-checkout-flow';

describe('buy checkout flow', () => {
  it('opens wallet checkout for EVM assets without an active payment', () => {
    expect(getInitialCheckoutStage({
      hasActivePayment: false,
      canUseWalletCheckout: true,
    })).toBe('choose_method');
  });

  it('opens direct-send address capture for non-EVM assets', () => {
    expect(getInitialCheckoutStage({
      hasActivePayment: false,
      canUseWalletCheckout: false,
    })).toBe('direct_address');
  });

  it('returns to direct instructions when a manual payment is already active', () => {
    expect(getInitialCheckoutStage({
      hasActivePayment: true,
      canUseWalletCheckout: true,
    })).toBe('direct_instructions');
  });

  it('renders wallet status only when a wallet address is connected', () => {
    expect(shouldRenderWalletConnectionStatus(null)).toBe(false);
    expect(shouldRenderWalletConnectionStatus('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
  });
});
