export const WALLET_CONNECTOR_ICON_SRC = {
  metamask: '/assets/wallets/metamask.svg',
  coinbasewallet: '/assets/wallets/coinbase-wallet.svg',
  walletconnect: '/assets/wallets/walletconnect.svg',
  'metamask-solana': '/assets/wallets/metamask.svg',
} as const;

export function normalizeWalletConnectorIconKey(connectorName: string | null | undefined) {
  const normalized = (connectorName ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'wallet_connect' || normalized === 'walletconnect') {
    return 'walletconnect';
  }

  return normalized;
}

export function getWalletConnectorIconSrc(connectorName: string | null | undefined) {
  const key = normalizeWalletConnectorIconKey(connectorName);
  return WALLET_CONNECTOR_ICON_SRC[key as keyof typeof WALLET_CONNECTOR_ICON_SRC] ?? null;
}
