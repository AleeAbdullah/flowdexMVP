export type WalletChallengeInput = {
  walletAddress: string;
  chainId?: number;
  walletChain?: 'ETHEREUM' | 'SOLANA' | 'TRON';
};

export type IWalletChallenge = {
  challengeId: string;
  walletChain: 'ETHEREUM' | 'SOLANA' | 'TRON';
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
  walletChain?: 'ETHEREUM' | 'SOLANA' | 'TRON';
  signature: string;
};

export type IWalletSession = {
  sessionId: string;
  walletChain: 'ETHEREUM' | 'SOLANA' | 'TRON';
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  lastVerifiedChainId: number | null;
  expiresAt: string;
};
