import { isHex, parseEther, toHex } from 'viem';

export type EthereumProvider = {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type Eip6963ProviderDetail = {
  info?: {
    icon?: string;
    name?: string;
    rdns?: string;
    uuid?: string;
  };
  provider?: EthereumProvider;
};

const announcedProviders = new Map<string, Eip6963ProviderDetail>();

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

export function getMetaMaskProvider(): EthereumProvider | null {
  const announced = getAnnouncedMetaMaskProvider();
  if (announced) {
    return announced;
  }

  const ethereum = getEthereumProvider();
  if (!ethereum) {
    return null;
  }

  const providerFromList = Array.isArray(ethereum.providers)
    ? ethereum.providers.find(isMetaMaskProvider)
    : null;

  if (providerFromList) {
    return providerFromList;
  }

  return isMetaMaskProvider(ethereum) ? ethereum : null;
}

export function registerEip6963Provider(detail: Eip6963ProviderDetail | undefined) {
  if (!detail?.provider) {
    return;
  }

  const key = detail.info?.uuid
    ?? detail.info?.rdns
    ?? detail.info?.name
    ?? `provider-${announcedProviders.size}`;
  announcedProviders.set(key, detail);
}

export function registerEip6963ProviderEvent(event: Event) {
  registerEip6963Provider((event as CustomEvent<Eip6963ProviderDetail>).detail);
}

export function requestEip6963Providers() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export function formatMetaMaskNetworkSwitchMessage(expectedNetworkLabel: string): string {
  return `MetaMask is connected on a different network. Open MetaMask from your browser toolbar, switch the active network to ${expectedNetworkLabel}, then try again.`;
}

function getAnnouncedMetaMaskProvider(): EthereumProvider | null {
  for (const detail of announcedProviders.values()) {
    if (!detail.provider) {
      continue;
    }

    const rdns = detail.info?.rdns?.toLowerCase() ?? '';
    const name = detail.info?.name?.toLowerCase() ?? '';
    if (isMetaMaskProvider(detail.provider) || rdns.includes('metamask') || name.includes('metamask')) {
      return detail.provider;
    }
  }

  return null;
}

function isMetaMaskProvider(provider: EthereumProvider | null | undefined): provider is EthereumProvider {
  return Boolean(provider?.isMetaMask);
}

export function normalizeNativeTransactionValue(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '0x0';
  }

  if (trimmed.startsWith('-')) {
    throw new Error('Transaction value cannot be negative.');
  }

  if (trimmed.startsWith('0x')) {
    if (!isHex(trimmed) || !/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      throw new Error('Hex transaction value must be a valid 0x-prefixed wei amount.');
    }

    return trimmed;
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Transaction value must be a decimal native-token amount or 0x-prefixed wei amount.');
  }

  return toHex(parseEther(trimmed));
}
