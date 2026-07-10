import type { IPaymentWalletTransactionRequest } from '@/dal/app/payments/payments.types';

export type CheckoutChain = 'ETHEREUM' | 'SOLANA' | 'TRON';

export type CheckoutTxIdKind = 'evm_tx_hash' | 'solana_signature' | 'tron_tx_hash';

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

export type TronPreparedWalletAction = {
  kind: 'tron_transaction';
  paymentIntentId: string;
  preparedActionId: string;
  chain: 'TRON';
  walletChainId: string;
  walletNetworkId: 'tron:mainnet';
  contractAddress: string;
  functionSelector: 'transfer(address,uint256)';
  recipientAddress: string;
  amountBaseUnits: string;
  feeLimitSun: string;
  payerAddress: string;
  payerAddressHex: string;
  expiresAt: string;
};

export type PreparedWalletAction =
  | EvmPreparedWalletAction
  | SolanaPreparedWalletAction
  | TronPreparedWalletAction;

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

export type TronWalletTxResult = {
  paymentIntentId: string;
  preparedActionId: string;
  chain: 'TRON';
  txIdKind: 'tron_tx_hash';
  txId: string;
};

export type WalletTxResult =
  | EvmWalletTxResult
  | SolanaWalletTxResult
  | TronWalletTxResult;
