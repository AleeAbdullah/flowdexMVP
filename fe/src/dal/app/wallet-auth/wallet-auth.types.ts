export type WalletChallengeInput = {
  walletAddress: string;
  chainId: number;
};

export type IWalletChallenge = {
  challengeId: string;
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
  chainId: number;
  signature: `0x${string}`;
};

export type IWalletSession = {
  sessionId: string;
  walletAddressNormalized: string;
  walletAddressChecksum: string;
  lastVerifiedChainId: number | null;
  expiresAt: string;
};
