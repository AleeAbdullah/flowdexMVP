import { BadRequestException } from '@nestjs/common';

import type { PaymentIntentEntity } from '../entities/payment-intent.entity';
import type { PaymentWalletActionEntity } from '../entities/payment-wallet-action.entity';
import {
  PaymentAsset,
  PaymentChain,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  TERMINAL_PAYMENT_INTENT_STATUSES,
} from '../payments.types';

export function assertWalletIntentIsUsable(
  intent: PaymentIntentEntity,
  senderAddress: string,
  chain: PaymentChain,
): void {
  if (chain === PaymentChain.ETHEREUM && (intent.chain !== PaymentChain.ETHEREUM || intent.asset !== PaymentAsset.ETH)) {
    throw new BadRequestException('ETH wallet checkout requires an ETH payment intent');
  }
  if (chain === PaymentChain.SOLANA && (intent.chain !== PaymentChain.SOLANA || intent.asset !== PaymentAsset.SOL)) {
    throw new BadRequestException('SOL wallet checkout requires a SOL payment intent');
  }
  if (chain === PaymentChain.TRON && (intent.chain !== PaymentChain.TRON || intent.asset !== PaymentAsset.USDT_TRC20)) {
    throw new BadRequestException('TRON wallet checkout requires a USDT TRC20 payment intent');
  }
  if (chain === PaymentChain.BITCOIN && (intent.chain !== PaymentChain.BITCOIN || intent.asset !== PaymentAsset.BTC)) {
    throw new BadRequestException('Bitcoin wallet checkout requires a BTC payment intent');
  }
  if (TERMINAL_PAYMENT_INTENT_STATUSES.has(intent.status)) {
    throw new BadRequestException('Payment intent is already final');
  }
  if (intent.expiresAt.getTime() <= Date.now()) {
    throw new BadRequestException('Payment intent expired');
  }
  if (!intent.senderAddress) {
    throw new BadRequestException('Payment intent senderAddress is required for wallet checkout');
  }
  if (intent.senderAddress !== senderAddress) {
    throw new BadRequestException('Payment intent senderAddress does not match wallet session');
  }
}

export function assertWalletActionIsUsable(
  action: PaymentWalletActionEntity,
  senderAddress: string,
  chain: PaymentChain,
): void {
  const isSupported = (
    (chain === PaymentChain.ETHEREUM && action.chain === PaymentChain.ETHEREUM && action.actionKind === PaymentWalletActionKind.EVM_TRANSACTION)
    || (chain === PaymentChain.SOLANA && action.chain === PaymentChain.SOLANA && action.actionKind === PaymentWalletActionKind.SOLANA_TRANSACTION)
    || (chain === PaymentChain.TRON && action.chain === PaymentChain.TRON && action.actionKind === PaymentWalletActionKind.TRON_TRANSACTION)
    || (chain === PaymentChain.BITCOIN && action.chain === PaymentChain.BITCOIN && action.actionKind === PaymentWalletActionKind.BITCOIN_TRANSFER)
  );

  if (!isSupported) {
    throw new BadRequestException('Unsupported prepared wallet action');
  }
  if (action.senderAddress !== senderAddress) {
    throw new BadRequestException('Prepared wallet action does not match wallet session');
  }
  if (action.status === PaymentWalletActionStatus.USED) {
    throw new BadRequestException('Prepared wallet action already used');
  }
  if (action.status === PaymentWalletActionStatus.CANCELLED) {
    throw new BadRequestException('Prepared wallet action cancelled');
  }
  if (action.expiresAt.getTime() <= Date.now()) {
    throw new BadRequestException('Prepared wallet action expired');
  }
  if (action.status !== PaymentWalletActionStatus.PREPARED) {
    throw new BadRequestException('Prepared wallet action is not usable');
  }
}
