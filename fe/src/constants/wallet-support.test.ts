import { describe, expect, it } from 'vitest';
import {
  buildWalletSupportRegistry,
  getAccountKitWalletOrder,
  getApprovedDirectWallets,
  getDirectWalletSupportCopy,
  getFeaturedWalletDisplayNames,
  getPrimaryWalletSupportCopy,
  getWalletConnectCompatibilityCopy,
} from './wallet-support';

describe('wallet support registry', () => {
  it('approves only the wallets recognized directly by the installed Account Kit SDK', () => {
    const registry = buildWalletSupportRegistry({ walletConnectEnabled: true });

    expect(getApprovedDirectWallets(registry).map(wallet => wallet.accountKitName)).toEqual([
      'metamask',
      'coinbase wallet',
    ]);
  });

  it('derives the Account Kit wallet order from direct wallets plus the WalletConnect gateway only', () => {
    const registry = buildWalletSupportRegistry({ walletConnectEnabled: true });

    expect(getAccountKitWalletOrder(registry)).toEqual([
      'metamask',
      'coinbase wallet',
      'wallet_connect',
    ]);
    expect(getFeaturedWalletDisplayNames(registry)).toEqual([
      'MetaMask',
      'Coinbase Wallet',
      'WalletConnect',
    ]);
  });

  it('degrades unsupported direct targets to WalletConnect compatibility when WalletConnect is enabled', () => {
    const registry = buildWalletSupportRegistry({ walletConnectEnabled: true });

    expect(getWalletConnectCompatibilityCopy(registry)).toBe(
      'WalletConnect support is checked after connection. Only wallets that approve checkout transaction sending for this chain can continue.',
    );
    expect(getPrimaryWalletSupportCopy(registry)).toBe('Choose a wallet to continue.');
  });

  it('disables fallback claims when WalletConnect is unavailable', () => {
    const registry = buildWalletSupportRegistry({ walletConnectEnabled: false });

    expect(getAccountKitWalletOrder(registry)).toEqual([
      'metamask',
      'coinbase wallet',
    ]);
    expect(getPrimaryWalletSupportCopy(registry)).toBe('Choose a wallet to continue.');
    expect(getWalletConnectCompatibilityCopy(registry)).toBe('WalletConnect is not available right now.');
    expect(getDirectWalletSupportCopy(registry)).toBe('Available now: MetaMask and Coinbase Wallet.');
  });
});
