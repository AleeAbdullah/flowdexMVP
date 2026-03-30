export enum Chain {
  ETH = 'ETH',
  ERC20 = 'ERC20',
  TRC20 = 'TRC20',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum IntentStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum BlockchainTxStatus {
  DETECTED = 'DETECTED',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  UNMATCHED = 'UNMATCHED',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}
