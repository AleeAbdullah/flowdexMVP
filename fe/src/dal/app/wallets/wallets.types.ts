export const WALLET_NETWORKS = {
  ETH_SEPOLIA: 'ETH_SEPOLIA',
  BASE_SEPOLIA: 'BASE_SEPOLIA',
} as const;

export type WalletNetwork = (typeof WALLET_NETWORKS)[keyof typeof WALLET_NETWORKS];

export const WALLET_PROVIDERS = {
  ALCHEMY_EMBEDDED: 'ALCHEMY_EMBEDDED',
  METAMASK: 'METAMASK',
} as const;

export type WalletProvider = (typeof WALLET_PROVIDERS)[keyof typeof WALLET_PROVIDERS];

export const WALLET_TRUST_LEVELS = {
  PROVIDER_ASSERTED: 'PROVIDER_ASSERTED',
  SIGNED: 'SIGNED',
} as const;

export type WalletTrustLevel = (typeof WALLET_TRUST_LEVELS)[keyof typeof WALLET_TRUST_LEVELS];

export type IWallet = {
  id: string;
  address: string;
  network: WalletNetwork;
  chainId: number;
  provider: WalletProvider;
  trustLevel: WalletTrustLevel;
  alchemyAccountId: string;
  alchemyWalletId: string;
  isPrimary: boolean;
  verifiedAt: string | null;
};

export type IWalletListResponse = {
  items: IWallet[];
};

export type CreateWalletChallengeInput = {
  provider: typeof WALLET_PROVIDERS.METAMASK;
  network: WalletNetwork;
  chainId: number;
  address: string;
  origin?: string;
};

export type IWalletChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

export type LinkWalletInput = {
  provider?: WalletProvider;
  network: WalletNetwork;
  chainId: number;
  address: string;
  alchemyAccountId?: string;
  alchemyWalletId?: string;
  challengeId?: string;
  signature?: string;
};
