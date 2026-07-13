import { formatUnits } from 'viem';
import {
  PAYMENT_CHAINS,
  type PaymentAsset,
  type PaymentChain,
  type PaymentIntentStatus,
} from '@/dal/app/payments/payments.types';

const assetDecimals: Record<PaymentAsset, number> = {
  ETH: 18,
  SOL: 9,
  BTC: 8,
  USDT_TRC20: 6,
};

export function formatTokenAmount(input: number) {
  if (!Number.isFinite(input) || input <= 0) {
    return '';
  }

  return input.toFixed(6).replace(/\.?0+$/u, '');
}

export function formatPaymentAmount(baseUnits: string, asset: PaymentAsset) {
  try {
    return `${formatUnits(BigInt(baseUnits), assetDecimals[asset])} ${asset}`;
  } catch {
    return `${baseUnits} ${asset}`;
  }
}

export function formatCompactCurrency(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits,
  }).format(value);
}

export function normalizeWalletAddress(address: string | null | undefined) {
  return address?.trim().toLowerCase() ?? null;
}

export function getChainLabel(chain: PaymentChain) {
  switch (chain) {
    case PAYMENT_CHAINS.ETHEREUM:
      return 'Ethereum';
    case PAYMENT_CHAINS.SOLANA:
      return 'Solana';
    case PAYMENT_CHAINS.BITCOIN:
      return 'Bitcoin';
    case PAYMENT_CHAINS.TRON:
      return 'TRON';
  }
}

export function getPaymentStatusCopy(status: PaymentIntentStatus) {
  switch (status) {
    case 'WAITING':
      return ['Waiting for payment', 'Send the exact amount shown. This page will update when the payment is detected.'] as const;
    case 'DETECTED':
      return ['Payment detected', 'The payment was found on-chain and is moving toward confirmation.'] as const;
    case 'CONFIRMING':
      return ['Confirming payment', 'The payment is on-chain. We are waiting for the required confirmations.'] as const;
    case 'CONFIRMED':
      return ['Payment confirmed', 'Your presale payment is confirmed and recorded for allocation review.'] as const;
    case 'UNDERPAID':
      return ['Amount was too low', 'The received amount was lower than required. Support review is needed.'] as const;
    case 'OVERPAID':
      return ['Amount was higher than expected', 'The received amount was higher than expected. Support review is needed.'] as const;
    case 'EXPIRED':
      return ['Payment window expired', 'Start a new purchase to receive fresh payment instructions.'] as const;
    case 'LATE_PAID':
      return ['Payment arrived after expiry', 'Support review is needed before allocation.'] as const;
    case 'FAILED':
    default:
      return ['Payment could not be confirmed', 'Start a new purchase or contact support.'] as const;
  }
}
