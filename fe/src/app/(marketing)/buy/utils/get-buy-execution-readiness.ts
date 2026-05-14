import { getWalletConnectSessionCapabilities } from './walletconnect-session-capabilities';
import type {
  BuyExecutionReadiness,
  BuyProviderAccountSnapshot,
  BuyWalletProvider,
  UnsupportedReason,
} from './buy-transaction.types';

const SUPPORTED_INJECTED_CONNECTORS = new Set([
  'metamask',
  'coinbasewallet',
]);

function normalizeWalletConnectorName(name: string | null | undefined) {
  const normalized = (name ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'wallet_connect' || normalized === 'walletconnect') {
    return 'walletconnect';
  }

  return normalized;
}

const UNSUPPORTED_REASON_MESSAGES: Record<UnsupportedReason, string> = {
  missing_provider: 'A compatible wallet provider is not available for checkout.',
  unsupported_injected_provider: 'This wallet is connected, but `/buy` only supports direct checkout from MetaMask or Coinbase Wallet.',
  unsupported_walletconnect_session: 'This WalletConnect session does not include the approved account or chain required for checkout.',
  inconclusive_walletconnect_session: 'WalletConnect did not expose enough approved session data to allow checkout on this route.',
  missing_walletconnect_eth_sendTransaction: 'This WalletConnect session did not approve `eth_sendTransaction`, so checkout cannot continue.',
  missing_switch_chain: 'This WalletConnect session cannot switch to the required chain for checkout.',
  wrong_chain: 'The connected wallet is on the wrong network for this checkout.',
  account_mismatch: 'The connected wallet no longer matches the verified wallet.',
  provider_disconnected: 'The wallet disconnected before checkout could continue.',
};

function isWalletConnectConnector(connectorName: string) {
  return connectorName === 'walletconnect';
}

function supportsSwitchChain(provider: BuyWalletProvider) {
  const sessionMethods = provider.session?.namespaces?.eip155?.methods ?? [];
  return sessionMethods.includes('wallet_switchEthereumChain');
}

export async function getBuyExecutionReadiness(input: {
  providerAccount: BuyProviderAccountSnapshot;
  requiredChainId: number | null;
}): Promise<BuyExecutionReadiness> {
  if (!input.providerAccount.isConnected || !input.providerAccount.connector) {
    return { status: 'checking' };
  }

  const connectorName = normalizeWalletConnectorName(
    input.providerAccount.connector.name ?? input.providerAccount.connector.id ?? null,
  );

  if (!connectorName) {
    return {
      status: 'unsupported',
      reason: 'missing_provider',
      walletKind: null,
      capabilityKey: null,
    };
  }

  if (!input.requiredChainId) {
    return { status: 'checking' };
  }

  const provider = await input.providerAccount.connector.getProvider().catch(() => null) as BuyWalletProvider | null;
  if (!provider || typeof provider.request !== 'function') {
    return {
      status: 'unsupported',
      reason: 'missing_provider',
      walletKind: isWalletConnectConnector(connectorName) ? 'walletconnect' : 'injected',
      capabilityKey: null,
    };
  }

  if (isWalletConnectConnector(connectorName)) {
    return getWalletConnectSessionCapabilities({
      provider,
      activeAddress: input.providerAccount.address ?? null,
      activeChainId: input.providerAccount.chainId ?? null,
      requiredChainId: input.requiredChainId,
    });
  }

  if (!SUPPORTED_INJECTED_CONNECTORS.has(connectorName)) {
    return {
      status: 'unsupported',
      reason: 'unsupported_injected_provider',
      walletKind: 'injected',
      capabilityKey: null,
    };
  }

  return {
    status: 'ready',
    sendMode: 'provider_send_transaction',
    walletKind: 'injected',
    supportsSwitchChain: supportsSwitchChain(provider) || !provider.session,
    capabilityKey: null,
  };
}

export function describeUnsupportedWalletReason(reason: UnsupportedReason) {
  return UNSUPPORTED_REASON_MESSAGES[reason];
}
