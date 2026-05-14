export function getHydrationConnectorName(name: string | null | undefined) {
  const normalized = (name ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'wallet_connect' || normalized === 'walletconnect') {
    return 'walletconnect';
  }

  return normalized;
}

type HydrationConnectorBase = {
  id?: string;
  name?: string;
  getProvider: () => Promise<unknown>;
};

export async function readAuthorizedInjectedConnector<TConnector extends HydrationConnectorBase>(input: {
  connectors: readonly TConnector[];
}) {
  for (const connector of input.connectors) {
    const connectorName = getHydrationConnectorName(connector.name ?? connector.id ?? null);
    if (!connectorName || connectorName === 'walletconnect') {
      continue;
    }

    const provider = await connector.getProvider().catch(() => null) as {
      request?: (args: { method: string }) => Promise<unknown>;
    } | null;

    if (!provider?.request) {
      continue;
    }

    const accounts = await provider.request({ method: 'eth_accounts' }).catch(() => []) as unknown;
    if (!Array.isArray(accounts) || accounts.length === 0 || typeof accounts[0] !== 'string') {
      continue;
    }

    const chainIdHex = await provider.request({ method: 'eth_chainId' }).catch(() => null) as string | null;
    const chainId = chainIdHex ? Number.parseInt(chainIdHex, 16) : null;

    return {
      connector,
      connectorName,
      chainId: Number.isFinite(chainId) ? chainId : null,
    };
  }

  return null;
}
