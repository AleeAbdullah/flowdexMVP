import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { PreparedWalletActionDto } from '../dto/payments.dto';
import { PaymentWalletActionEntity } from '../entities/payment-wallet-action.entity';
import {
  PaymentChain,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  PaymentWalletTxIdKind,
} from '../payments.types';
import { assertWalletIntentIsUsable } from './wallet-checkout.guards';
import type { WalletActionExecutor, WalletActionPrepareInput } from './wallet-action-executor.types';

const PAYMENT_WALLET_ACTION_TTL_MS = 5 * 60 * 1000;
const BTC_TX_ID_PATTERN = /^[a-fA-F0-9]{64}$/;

@Injectable()
export class BitcoinWalletActionExecutor implements WalletActionExecutor {
  readonly chain = PaymentChain.BITCOIN;

  constructor(
    @InjectRepository(PaymentWalletActionEntity)
    private readonly paymentWalletActionsRepository: Repository<PaymentWalletActionEntity>,
  ) {}

  async prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto> {
    const walletChainId = typeof input.dto.walletChainId === 'string' ? input.dto.walletChainId.trim() : '';
    if (walletChainId && walletChainId !== 'mainnet') {
      throw new BadRequestException('Xverse must be connected to Bitcoin mainnet');
    }

    assertWalletIntentIsUsable(input.intent, input.senderAddress, PaymentChain.BITCOIN);
    const prepared = {
      network: 'mainnet' as const,
      recipientAddress: input.intent.receiverAddress,
      amountSats: input.intent.expectedAmountBaseUnits,
    };
    const action = await this.paymentWalletActionsRepository.save(
      this.paymentWalletActionsRepository.create({
        paymentIntentId: input.intent.id,
        chain: PaymentChain.BITCOIN,
        actionKind: PaymentWalletActionKind.BITCOIN_TRANSFER,
        senderAddress: input.senderAddress,
        walletChainId: 'mainnet',
        status: PaymentWalletActionStatus.PREPARED,
        requestJson: prepared,
        expiresAt: new Date(Date.now() + PAYMENT_WALLET_ACTION_TTL_MS),
        usedAt: null,
        txId: null,
        txIdKind: null,
      }),
    );

    return {
      kind: PaymentWalletActionKind.BITCOIN_TRANSFER,
      paymentIntentId: input.intent.id,
      preparedActionId: action.id,
      chain: PaymentChain.BITCOIN,
      walletChainId: 'mainnet',
      bitcoin: prepared,
      expiresAt: action.expiresAt,
    };
  }

  assertTxId(txIdKind: PaymentWalletTxIdKind, txId: string): void {
    if (txIdKind !== PaymentWalletTxIdKind.BTC_TX_HASH || !BTC_TX_ID_PATTERN.test(txId)) {
      throw new BadRequestException('Bitcoin wallet checkout requires a 32-byte Bitcoin transaction id');
    }
  }
}
