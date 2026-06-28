export type WalletChallengeInput = {
  walletAddress: string;
  chainId?: number;
  walletChain?: 'ETHEREUM' | 'SOLANA';
};

export type IWalletChallenge = {
  challengeId: string;
  walletChain: 'ETHEREUM' | 'SOLANA';
  domain: string;
  uri: string;
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  statement: string;
  message: string;
};

export type WalletVerifyInput = {
  challengeId: string;
  walletAddress: string;
  chainId?: number;
  walletChain?: 'ETHEREUM' | 'SOLANA';
  signature: string;
};

export type IWalletSession = {
  sessionId: string;
  walletChain: 'ETHEREUM' | 'SOLANA';
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  lastVerifiedChainId: number | null;
  expiresAt: string;
};
