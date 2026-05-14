export type WalletIntendedTier = 'direct' | 'fallback';
export type WalletReleaseTier = 'direct' | 'fallback' | 'disabled';

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
  return [
    {
      ...walletConnectOption,
      releaseTier: input.walletConnectEnabled ? 'fallback' : 'disabled',
    },
    ...DIRECT_WALLETS,
  ] satisfies WalletSupportEntry[];
}

export function getApprovedDirectWallets(registry: WalletSupportEntry[]) {
  return registry.filter(wallet => wallet.releaseTier === 'direct');
}

export function getApprovedDirectWalletDisplayNames(registry: WalletSupportEntry[]) {
  return getApprovedDirectWallets(registry).map(wallet => wallet.displayName);
}

export function getWalletConnectEntry(registry: WalletSupportEntry[]) {
  return registry.find(wallet => wallet.id === walletConnectOption.id) ?? null;
}

export function getAccountKitWalletOrder(registry: WalletSupportEntry[]) {
  const walletConnect = getWalletConnectEntry(registry);
  const approvedDirectWallets = getApprovedDirectWallets(registry);

  return [
    ...approvedDirectWallets.map(wallet => wallet.accountKitName),
    ...(walletConnect?.releaseTier === 'fallback' ? [walletConnect.accountKitName] : []),
  ];
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

  return 'WalletConnect support is checked after connection. Only wallets that approve checkout transaction sending for this chain can continue.';
}

export function getPrimaryWalletSupportCopy(_registry: WalletSupportEntry[]) {
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
