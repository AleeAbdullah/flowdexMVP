import type { IPaymentWalletTransactionRequest } from '@/dal/app/payments/payments.types';

export type CheckoutChain = 'ETHEREUM' | 'SOLANA';

export type CheckoutTxIdKind = 'evm_tx_hash' | 'solana_signature';

export type EvmPreparedWalletAction = {
  kind: 'evm_transaction';
  paymentIntentId: string;
  preparedActionId: string;
  chain: 'ETHEREUM';
  chainId: number;
  request: IPaymentWalletTransactionRequest;
  expiresAt: string;
};

export type SolanaPreparedWalletAction = {
  kind: 'solana_transaction';
  paymentIntentId: string;
  preparedActionId: string;
  chain: 'SOLANA';
  cluster: 'mainnet-beta';
  walletChainId: string;
  payer: string;
  transaction: string;
  transactionEncoding: 'base64';
  expiresAt: string;
  lastValidBlockHeight: number;
};

export type PreparedWalletAction =
  | EvmPreparedWalletAction
  | SolanaPreparedWalletAction;

export type EvmWalletTxResult = {
  paymentIntentId: string;
  preparedActionId: string;
  chain: 'ETHEREUM';
  txIdKind: 'evm_tx_hash';
  txId: `0x${string}`;
};

export type SolanaWalletTxResult = {
  paymentIntentId: string;
  preparedActionId: string;
  chain: 'SOLANA';
  txIdKind: 'solana_signature';
  txId: string;
};

export type WalletTxResult =
  | EvmWalletTxResult
  | SolanaWalletTxResult;
