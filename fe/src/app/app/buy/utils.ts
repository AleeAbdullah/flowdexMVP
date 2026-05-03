import type { ISimulateTransactionResult } from '@/dal/app/transactions/transactions.types';
import { WALLET_NETWORKS, type WalletNetwork } from '@/dal/app/wallets/wallets.types';
import { Env } from '@/libs/Env';

export function resolveTreasuryRecipient(network: WalletNetwork | null | undefined) {
  if (network === WALLET_NETWORKS.BASE_SEPOLIA) {
    return Env.NEXT_PUBLIC_TREASURY_ADDRESS_BASE_SEPOLIA ?? '';
  }

  if (network === WALLET_NETWORKS.ETH_SEPOLIA) {
    return Env.NEXT_PUBLIC_TREASURY_ADDRESS_ETH_SEPOLIA ?? '';
  }

  return '';
}

export function resolveSimulationSummary(result?: ISimulateTransactionResult | null) {
  if (result) {
    return result.allowed
      ? 'Check passed. This transaction is ready to track.'
      : `Check blocked: ${result.reason ?? 'Unknown risk'}`;
  }

  return 'Run a transaction check before tracking a receipt.';
}
