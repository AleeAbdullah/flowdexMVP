export enum Chain {
  ETH = 'ETH',
  ERC20 = 'ERC20',
  TRC20 = 'TRC20',
  ETH_SEPOLIA = 'ETH_SEPOLIA',
  BASE_SEPOLIA = 'BASE_SEPOLIA',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum LedgerTxStatus {
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  DROPPED = 'DROPPED',
  UNMATCHED = 'UNMATCHED',
}

export enum WalletProvider {
  ALCHEMY_EMBEDDED = 'ALCHEMY_EMBEDDED',
  METAMASK = 'METAMASK',
}

export enum WalletTrustLevel {
  PROVIDER_ASSERTED = 'PROVIDER_ASSERTED',
  SIGNED = 'SIGNED',
}
