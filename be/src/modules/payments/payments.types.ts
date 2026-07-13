export enum PaymentChain {
  ETHEREUM = 'ETHEREUM',
  SOLANA = 'SOLANA',
  BITCOIN = 'BITCOIN',
  TRON = 'TRON',
}

export enum PaymentAsset {
  ETH = 'ETH',
  SOL = 'SOL',
  BTC = 'BTC',
  USDT_TRC20 = 'USDT_TRC20',
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

export enum PaymentWalletActionKind {
  EVM_TRANSACTION = 'evm_transaction',
  SOLANA_TRANSACTION = 'solana_transaction',
  TRON_TRANSACTION = 'tron_transaction',
  BITCOIN_TRANSFER = 'bitcoin_transfer',
}

export enum PaymentWalletActionStatus {
  PREPARED = 'PREPARED',
  SUBMITTED = 'SUBMITTED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentWalletTxIdKind {
  EVM_TX_HASH = 'evm_tx_hash',
  SOLANA_SIGNATURE = 'solana_signature',
  TRON_TX_HASH = 'tron_tx_hash',
  BTC_TX_HASH = 'btc_tx_hash',
}

export const PAYMENT_ASSET_DECIMALS: Record<PaymentAsset, number> = {
  [PaymentAsset.ETH]: 18,
  [PaymentAsset.SOL]: 9,
  [PaymentAsset.BTC]: 8,
  [PaymentAsset.USDT_TRC20]: 6,
};

export const CHAIN_ASSET: Record<PaymentChain, PaymentAsset> = {
  [PaymentChain.ETHEREUM]: PaymentAsset.ETH,
  [PaymentChain.SOLANA]: PaymentAsset.SOL,
  [PaymentChain.BITCOIN]: PaymentAsset.BTC,
  [PaymentChain.TRON]: PaymentAsset.USDT_TRC20,
};

export const TERMINAL_PAYMENT_INTENT_STATUSES = new Set<PaymentIntentStatus>([
  PaymentIntentStatus.CONFIRMED,
  PaymentIntentStatus.EXPIRED,
  PaymentIntentStatus.FAILED,
  PaymentIntentStatus.UNDERPAID,
  PaymentIntentStatus.OVERPAID,
  PaymentIntentStatus.LATE_PAID,
]);
