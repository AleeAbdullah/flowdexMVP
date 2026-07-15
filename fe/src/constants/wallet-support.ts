type WalletIntendedTier = 'direct';
type WalletReleaseTier = 'direct';

type WalletSupportEntry = {
  id: string;
  accountKitName: string;
  displayName: string;
  intendedTier: WalletIntendedTier;
  releaseTier: WalletReleaseTier;
  featured: boolean;
  qaTarget: boolean;
};

const DIRECT_WALLETS: WalletSupportEntry[] = [
  {
    id: 'metamask',
    accountKitName: 'metamask',
    displayName: 'MetaMask',
    intendedTier: 'direct',
    releaseTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'coinbase-wallet',
    accountKitName: 'coinbase wallet',
    displayName: 'Coinbase Wallet',
    intendedTier: 'direct',
    releaseTier: 'direct',
    featured: true,
    qaTarget: true,
  },
];

function formatDisplayNameList(displayNames: string[]) {
  if (displayNames.length === 0) {
    return '';
  }

  return new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  }).format(displayNames);
}

export function buildWalletSupportRegistry() {
  return DIRECT_WALLETS satisfies WalletSupportEntry[];
}

function getApprovedDirectWallets(registry: WalletSupportEntry[]) {
  return registry.filter(wallet => wallet.releaseTier === 'direct');
}

export function getAccountKitWalletOrder(registry: WalletSupportEntry[]) {
  const approvedDirectWallets = getApprovedDirectWallets(registry);

  return approvedDirectWallets.map(wallet => wallet.accountKitName);
}

function getFeaturedWalletDisplayNames(registry: WalletSupportEntry[]) {
  return getApprovedDirectWallets(registry)
    .filter(wallet => wallet.featured)
    .map(wallet => wallet.displayName);
}

export function getFeaturedWalletCount(registry: WalletSupportEntry[]) {
  return getFeaturedWalletDisplayNames(registry).length;
}

export function getDirectWalletSupportCopy(registry: WalletSupportEntry[]) {
  const approvedDirectWallets = getApprovedDirectWallets(registry);

  if (approvedDirectWallets.length === 0) {
    return 'No direct wallet options are available right now.';
  }

  return `Available now: ${formatDisplayNameList(approvedDirectWallets.map(wallet => wallet.displayName))}.`;
}

export function getPrimaryWalletSupportCopy(_registry: WalletSupportEntry[]) {
  return 'Choose a wallet to continue.';
}
