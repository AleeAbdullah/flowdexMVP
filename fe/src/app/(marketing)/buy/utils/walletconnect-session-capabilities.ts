import { normalizeWalletAddress } from './buy-view-model';
import type { BuyExecutionReadiness, BuyWalletProvider } from './buy-transaction.types';

const WALLET_CONNECT_NAMESPACE = 'eip155';
const ETH_SEND_TRANSACTION_METHOD = 'eth_sendTransaction';
const SWITCH_CHAIN_METHOD = 'wallet_switchEthereumChain';

export function getWalletConnectSessionCapabilities(input: {
  provider: BuyWalletProvider;
  activeAddress: string | null;
  activeChainId: number | null;
  requiredChainId: number;
}): BuyExecutionReadiness {
  const session = input.provider.session;
  const namespace = session?.namespaces?.[WALLET_CONNECT_NAMESPACE];

  if (!session || !namespace) {
    return {
      status: 'unsupported',
      reason: 'unsupported_walletconnect_session',
      walletKind: 'walletconnect',
      capabilityKey: null,
    };
  }

  const methods = namespace.methods ?? [];
  const accounts = namespace.accounts ?? [];
  const normalizedActiveAddress = normalizeWalletAddress(input.activeAddress);
  const activeChainAccount = normalizedActiveAddress
    ? `${WALLET_CONNECT_NAMESPACE}:${input.activeChainId}:${normalizedActiveAddress}`
    : null;
  const requiredChainAccount = normalizedActiveAddress
    ? `${WALLET_CONNECT_NAMESPACE}:${input.requiredChainId}:${normalizedActiveAddress}`
    : null;
  const normalizedAccounts = new Set(
    accounts.map((account) => {
      const [namespaceName, chainId, address] = account.split(':');
      return `${namespaceName}:${chainId}:${normalizeWalletAddress(address) ?? ''}`;
    }),
  );

  if (!methods.length || !accounts.length || !normalizedActiveAddress || !input.activeChainId) {
    return {
      status: 'unsupported',
      reason: 'inconclusive_walletconnect_session',
      walletKind: 'walletconnect',
      capabilityKey: session.topic ?? null,
    };
  }

  if (!methods.includes(ETH_SEND_TRANSACTION_METHOD)) {
    return {
      status: 'unsupported',
      reason: 'missing_walletconnect_eth_sendTransaction',
      walletKind: 'walletconnect',
      capabilityKey: session.topic ?? null,
    };
  }

  if (!activeChainAccount || !normalizedAccounts.has(activeChainAccount)) {
    return {
      status: 'unsupported',
      reason: 'unsupported_walletconnect_session',
      walletKind: 'walletconnect',
      capabilityKey: session.topic ?? null,
    };
  }

  const supportsSwitchChain = methods.includes(SWITCH_CHAIN_METHOD);
  const requiredChainApproved = requiredChainAccount
    ? normalizedAccounts.has(requiredChainAccount)
    : false;

  if (input.activeChainId !== input.requiredChainId && !supportsSwitchChain && !requiredChainApproved) {
    return {
      status: 'unsupported',
      reason: 'missing_switch_chain',
      walletKind: 'walletconnect',
      capabilityKey: session.topic ?? null,
    };
  }

  return {
    status: 'ready',
    sendMode: 'provider_send_transaction',
    walletKind: 'walletconnect',
    supportsSwitchChain,
    capabilityKey: session.topic ?? null,
  };
}
