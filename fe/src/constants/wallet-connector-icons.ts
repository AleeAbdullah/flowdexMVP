const WALLET_CONNECTOR_ICON_SRC = {
  metamask: '/assets/wallets/metamask.svg',
  metamaskbitcoin: '/assets/wallets/metamask.svg',
  coinbasewallet: '/assets/wallets/coinbase-wallet.svg',
  'metamask-solana': '/assets/wallets/metamask.svg',
} as const;

function normalizeWalletConnectorIconKey(connectorName: string | null | undefined) {
  return (connectorName ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export function getWalletConnectorIconSrc(connectorName: string | null | undefined) {
  const key = normalizeWalletConnectorIconKey(connectorName);
  return WALLET_CONNECTOR_ICON_SRC[key as keyof typeof WALLET_CONNECTOR_ICON_SRC] ?? null;
}
