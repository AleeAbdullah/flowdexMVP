export type WalletIntendedTier = 'direct' | 'fallback';
export type WalletReleaseTier = 'direct' | 'walletconnect-compatible' | 'fallback' | 'disabled';

export type WalletSupportEntry = {
  id: string;
  accountKitName: string;
  displayName: string;
  intendedTier: WalletIntendedTier;
  releaseTier: WalletReleaseTier;
  featured: boolean;
  qaTarget: boolean;
};

export type BuyWalletPickerEntry = Pick<
  WalletSupportEntry,
  'id' | 'accountKitName' | 'displayName' | 'releaseTier'
>;

type WalletSupportRuntimeInput = {
  alchemyApiKey?: string | null;
  nodeEnv?: string | null;
  walletConnectProjectId?: string | null;
};

type DirectWalletTarget = Omit<WalletSupportEntry, 'releaseTier'>;

const FEATURED_DIRECT_WALLET_IDS = new Set([
  'metamask',
  'coinbase-wallet',
  'trust-wallet',
  'rabby',
  'rainbow',
  'okx-wallet',
  'binance-wallet',
  'bitget-wallet',
]);

// The installed Account Kit version only exposes built-in direct EVM support for these names.
const ACCOUNT_KIT_RECOGNIZED_DIRECT_EVM_WALLET_NAMES = new Set([
  'metamask',
  'coinbase wallet',
]);

const desiredDirectWalletTargets: DirectWalletTarget[] = [
  {
    id: 'metamask',
    accountKitName: 'metamask',
    displayName: 'MetaMask',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'coinbase-wallet',
    accountKitName: 'coinbase wallet',
    displayName: 'Coinbase Wallet',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'trust-wallet',
    accountKitName: 'trust wallet',
    displayName: 'Trust Wallet',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'rabby',
    accountKitName: 'rabby',
    displayName: 'Rabby',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'rainbow',
    accountKitName: 'rainbow',
    displayName: 'Rainbow',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'okx-wallet',
    accountKitName: 'okx wallet',
    displayName: 'OKX Wallet',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'binance-wallet',
    accountKitName: 'binance wallet',
    displayName: 'Binance Wallet',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'bitget-wallet',
    accountKitName: 'bitget wallet',
    displayName: 'Bitget Wallet',
    intendedTier: 'direct',
    featured: true,
    qaTarget: true,
  },
  {
    id: 'crypto-com-onchain',
    accountKitName: 'crypto.com onchain',
    displayName: 'Crypto.com Onchain',
    intendedTier: 'direct',
    featured: false,
    qaTarget: true,
  },
  {
    id: 'uniswap-wallet',
    accountKitName: 'uniswap wallet',
    displayName: 'Uniswap Wallet',
    intendedTier: 'direct',
    featured: false,
    qaTarget: true,
  },
  {
    id: 'kucoin-wallet',
    accountKitName: 'kucoin wallet',
    displayName: 'KuCoin Wallet',
    intendedTier: 'direct',
    featured: false,
    qaTarget: true,
  },
  {
    id: 'kraken-wallet',
    accountKitName: 'kraken wallet',
    displayName: 'Kraken Wallet',
    intendedTier: 'direct',
    featured: false,
    qaTarget: true,
  },
].map(wallet => ({
  ...wallet,
  featured: FEATURED_DIRECT_WALLET_IDS.has(wallet.id),
})) as DirectWalletTarget[];

export const walletConnectOption = {
  id: 'wallet-connect',
  accountKitName: 'wallet_connect',
  displayName: 'WalletConnect',
  intendedTier: 'fallback' as const,
  featured: true,
  qaTarget: true,
};

function formatDisplayNameList(displayNames: string[]) {
  if (displayNames.length === 0) {
    return '';
  }

  return new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  }).format(displayNames);
}

function promoteDesiredWalletTarget(
  wallet: DirectWalletTarget,
  walletConnectEnabled: boolean,
): WalletSupportEntry {
  if (ACCOUNT_KIT_RECOGNIZED_DIRECT_EVM_WALLET_NAMES.has(wallet.accountKitName)) {
    return {
      ...wallet,
      releaseTier: 'direct',
    };
  }

  return {
    ...wallet,
    releaseTier: walletConnectEnabled ? 'walletconnect-compatible' : 'disabled',
  };
}

export function getWalletSupportRuntime(input?: WalletSupportRuntimeInput) {
  const walletConnectProjectId = (input?.walletConnectProjectId
    ?? process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    ?? '').trim();
  const alchemyApiKey = (input?.alchemyApiKey ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ?? '').trim();
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  const walletConnectEnabled = walletConnectProjectId.length > 0;
  const shouldFailWithoutWalletConnect = nodeEnv === 'production'
    && alchemyApiKey.length > 0
    && !walletConnectEnabled;

  return {
    walletConnectEnabled,
    walletConnectProjectId: walletConnectEnabled ? walletConnectProjectId : null,
    shouldFailWithoutWalletConnect,
  };
}

export function buildWalletSupportRegistry(input: {
  walletConnectEnabled: boolean;
}) {
  const registry: WalletSupportEntry[] = [
    {
      ...walletConnectOption,
      releaseTier: input.walletConnectEnabled ? 'fallback' : 'disabled',
    },
    ...desiredDirectWalletTargets.map(wallet => promoteDesiredWalletTarget(wallet, input.walletConnectEnabled)),
  ];

  return registry;
}

export function getApprovedDirectWallets(registry: WalletSupportEntry[]) {
  return registry.filter(wallet => wallet.releaseTier === 'direct');
}

export function getApprovedDirectWalletDisplayNames(registry: WalletSupportEntry[]) {
  return getApprovedDirectWallets(registry).map(wallet => wallet.displayName);
}

export function getWalletConnectCompatibleWallets(registry: WalletSupportEntry[]) {
  return registry.filter(wallet => wallet.releaseTier === 'walletconnect-compatible');
}

export function getWalletConnectCompatibleDisplayNames(registry: WalletSupportEntry[]) {
  return getWalletConnectCompatibleWallets(registry).map(wallet => wallet.displayName);
}

export function getWalletConnectEntry(registry: WalletSupportEntry[]) {
  return registry.find(wallet => wallet.id === walletConnectOption.id) ?? null;
}

export function getAccountKitWalletOrder(registry: WalletSupportEntry[]) {
  const walletConnect = getWalletConnectEntry(registry);
  const approvedDirectWallets = getApprovedDirectWallets(registry);
  const wallets = [
    ...approvedDirectWallets.map(wallet => wallet.accountKitName),
    ...(walletConnect?.releaseTier === 'fallback' ? [walletConnect.accountKitName] : []),
  ];

  return wallets;
}

export function getBuyWalletPickerEntries(registry: WalletSupportEntry[]): BuyWalletPickerEntry[] {
  const walletConnect = getWalletConnectEntry(registry);
  return [
    ...getApprovedDirectWallets(registry).map(wallet => ({
      id: wallet.id,
      accountKitName: wallet.accountKitName,
      displayName: wallet.displayName,
      releaseTier: wallet.releaseTier,
    })),
    ...(walletConnect?.releaseTier === 'fallback'
      ? [{
          id: walletConnect.id,
          accountKitName: walletConnect.accountKitName,
          displayName: walletConnect.displayName,
          releaseTier: walletConnect.releaseTier,
        }]
      : []),
  ];
}

export function getFeaturedWalletDisplayNames(registry: WalletSupportEntry[]) {
  const approvedDirectWallets = getApprovedDirectWallets(registry)
    .filter(wallet => wallet.featured)
    .slice(0, 8)
    .map(wallet => wallet.displayName);
  const walletConnect = getWalletConnectEntry(registry);

  return [
    ...approvedDirectWallets,
    ...(walletConnect?.releaseTier === 'fallback' ? [walletConnect.displayName] : []),
  ];
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

export function getWalletConnectCompatibilityCopy(registry: WalletSupportEntry[]) {
  const walletConnect = getWalletConnectEntry(registry);

  if (walletConnect?.releaseTier !== 'fallback') {
    return 'WalletConnect is not available right now.';
  }

  const compatibleWallets = getWalletConnectCompatibleWallets(registry);
  if (compatibleWallets.length === 0) {
    return 'WalletConnect is enabled for additional EVM wallet compatibility.';
  }

  return `You can also connect wallets like ${formatDisplayNameList(compatibleWallets.map(wallet => wallet.displayName))} through WalletConnect.`;
}

export function getPrimaryWalletSupportCopy(registry: WalletSupportEntry[]) {
  const walletConnect = getWalletConnectEntry(registry);

  if (walletConnect?.releaseTier === 'fallback') {
    return 'Choose a wallet to continue.';
  }

  return 'Choose a wallet to continue.';
}

export function getWalletSupportSummary(registry: WalletSupportEntry[]) {
  return {
    directSupportCopy: getDirectWalletSupportCopy(registry),
    featuredWalletDisplayNames: getFeaturedWalletDisplayNames(registry),
    primarySupportCopy: getPrimaryWalletSupportCopy(registry),
    walletConnectCompatibilityCopy: getWalletConnectCompatibilityCopy(registry),
  };
}
