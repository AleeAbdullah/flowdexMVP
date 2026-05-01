import { WALLET_NETWORKS, type WalletNetwork } from '@/dal/app/wallets/wallets.types';

export const NETWORK_LABELS: Record<WalletNetwork, string> = {
  [WALLET_NETWORKS.ETH_SEPOLIA]: 'Ethereum Sepolia',
  [WALLET_NETWORKS.BASE_SEPOLIA]: 'Base Sepolia',
};

export const NETWORK_CHAIN_IDS: Record<WalletNetwork, number> = {
  [WALLET_NETWORKS.ETH_SEPOLIA]: 11155111,
  [WALLET_NETWORKS.BASE_SEPOLIA]: 84532,
};
