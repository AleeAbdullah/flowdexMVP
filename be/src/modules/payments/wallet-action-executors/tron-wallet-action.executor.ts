import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AlchemyService } from '../../alchemy/alchemy.service';
import type { PreparedWalletActionDto } from '../dto/payments.dto';
import { PaymentWalletActionEntity } from '../entities/payment-wallet-action.entity';
import {
  PaymentChain,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  PaymentWalletTxIdKind,
} from '../payments.types';
import {
  TronPaymentExecutionService,
} from '../services/tron-payment-execution.service';
import { assertWalletIntentIsUsable } from './wallet-checkout.guards';
import type {
  WalletActionExecutor,
  WalletActionPrepareInput,
} from './wallet-action-executor.types';

const PAYMENT_WALLET_ACTION_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class TronWalletActionExecutor implements WalletActionExecutor {
  readonly chain = PaymentChain.TRON;

  constructor(
    @InjectRepository(PaymentWalletActionEntity)
    private readonly paymentWalletActionsRepository: Repository<PaymentWalletActionEntity>,
    private readonly tronPaymentExecutionService: TronPaymentExecutionService,
    private readonly alchemyService: AlchemyService,
  ) {}

  async prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto> {
    const walletChainId = this.tronPaymentExecutionService.normalizeWalletChainId(
      typeof input.dto.walletChainId === 'string' ? input.dto.walletChainId : null,
    );

    assertWalletIntentIsUsable(input.intent, input.senderAddress, PaymentChain.TRON);

    const transfer = this.tronPaymentExecutionService.buildPreparedTransfer({
      payerAddress: input.senderAddress,
      recipientAddress: input.intent.receiverAddress,
      amountBaseUnits: input.intent.expectedAmountBaseUnits,
    });
    const unsignedTransaction = await this.alchemyService.createTronSmartContractTransaction({
      ownerAddress: transfer.payerAddress,
      contractAddress: transfer.contractAddress,
      functionSelector: transfer.functionSelector,
      parameter: this.tronPaymentExecutionService.buildSmartContractParameter(transfer),
      feeLimitSun: Number(transfer.feeLimitSun),
    });
    if (!unsignedTransaction) {
      throw new ServiceUnavailableException('Unable to prepare the TRON wallet transaction');
    }
    const prepared = this.tronPaymentExecutionService.toPreparedTransfer(transfer, unsignedTransaction);
    const expiresAt = new Date(Date.now() + PAYMENT_WALLET_ACTION_TTL_MS);
    const action = await this.paymentWalletActionsRepository.save(
      this.paymentWalletActionsRepository.create({
        paymentIntentId: input.intent.id,
        chain: PaymentChain.TRON,
        actionKind: PaymentWalletActionKind.TRON_TRANSACTION,
        senderAddress: input.senderAddress,
        walletChainId,
        status: PaymentWalletActionStatus.PREPARED,
        requestJson: prepared,
        expiresAt,
        usedAt: null,
        txId: null,
        txIdKind: null,
      }),
    );

    return {
      kind: PaymentWalletActionKind.TRON_TRANSACTION,
      paymentIntentId: input.intent.id,
      preparedActionId: action.id,
      chain: PaymentChain.TRON,
      walletChainId,
      tron: prepared,
      expiresAt: action.expiresAt,
    };
  }

  assertTxId(txIdKind: PaymentWalletTxIdKind, txId: string): void {
    if (txIdKind !== PaymentWalletTxIdKind.TRON_TX_HASH) {
      throw new BadRequestException('TRON wallet checkout requires a TRON transaction hash');
    }

    this.tronPaymentExecutionService.assertTxIdFormat(txId);
  }
}
