export enum PaymentChain {
  ETHEREUM = 'ETHEREUM',
  SOLANA = 'SOLANA',
  BITCOIN = 'BITCOIN',
}

export enum PaymentAsset {
  ETH = 'ETH',
  SOL = 'SOL',
  BTC = 'BTC',
}

export enum PaymentIntentStatus {
  WAITING = 'WAITING',
  DETECTED = 'DETECTED',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  UNDERPAID = 'UNDERPAID',
  OVERPAID = 'OVERPAID',
  LATE_PAID = 'LATE_PAID',
}

export enum PaymentStatus {
  DETECTED = 'DETECTED',
  CONFIRMING = 'CONFIRMING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  UNDERPAID = 'UNDERPAID',
  OVERPAID = 'OVERPAID',
  LATE_PAID = 'LATE_PAID',
}

export const PAYMENT_ASSET_DECIMALS: Record<PaymentAsset, number> = {
  [PaymentAsset.ETH]: 18,
  [PaymentAsset.SOL]: 9,
  [PaymentAsset.BTC]: 8,
};

export const CHAIN_ASSET: Record<PaymentChain, PaymentAsset> = {
  [PaymentChain.ETHEREUM]: PaymentAsset.ETH,
  [PaymentChain.SOLANA]: PaymentAsset.SOL,
  [PaymentChain.BITCOIN]: PaymentAsset.BTC,
};

export const TERMINAL_PAYMENT_INTENT_STATUSES = new Set<PaymentIntentStatus>([
  PaymentIntentStatus.CONFIRMED,
  PaymentIntentStatus.EXPIRED,
  PaymentIntentStatus.FAILED,
  PaymentIntentStatus.UNDERPAID,
  PaymentIntentStatus.OVERPAID,
  PaymentIntentStatus.LATE_PAID,
]);
