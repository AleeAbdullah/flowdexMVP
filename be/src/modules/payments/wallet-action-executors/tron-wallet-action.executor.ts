import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AlchemyService } from '../../alchemy/alchemy.service';
import type { PreparedWalletActionDto } from '../dto/payments.dto';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentWalletActionEntity } from '../entities/payment-wallet-action.entity';
import {
  PaymentChain,
  PaymentStatus,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  PaymentWalletTxIdKind,
} from '../payments.types';
import {
  TronPaymentExecutionService,
  type TronPreparedTransfer,
} from '../services/tron-payment-execution.service';
import { PaymentStateService } from '../services/payment-state.service';
import { assertWalletActionIsUsable, assertWalletIntentIsUsable } from './wallet-checkout.guards';
import type {
  WalletActionExecutor,
  WalletActionPrepareInput,
  WalletActionSubmitInput,
  WalletActionSubmitResult,
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
    private readonly stateService: PaymentStateService,
  ) {}

  async prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto> {
    const walletChainId = this.tronPaymentExecutionService.normalizeWalletChainId(
      typeof input.dto.walletChainId === 'string' ? input.dto.walletChainId : null,
    );

    assertWalletIntentIsUsable(input.intent, input.senderAddress, PaymentChain.TRON);

    const prepared = this.tronPaymentExecutionService.buildPreparedTransfer({
      payerAddress: input.senderAddress,
      recipientAddress: input.intent.receiverAddress,
      amountBaseUnits: input.intent.expectedAmountBaseUnits,
    });
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

  async submitTxResult(input: WalletActionSubmitInput): Promise<WalletActionSubmitResult> {
    if (input.dto.txIdKind !== PaymentWalletTxIdKind.TRON_TX_HASH) {
      throw new BadRequestException('TRON wallet checkout requires a TRON transaction hash');
    }

    this.tronPaymentExecutionService.assertTxIdFormat(input.dto.txId);
    assertWalletActionIsUsable(input.action, input.wallet.normalized, PaymentChain.TRON);

    const prepared = input.action.requestJson as TronPreparedTransfer;
    if (!prepared || prepared.kind !== 'tron_transaction') {
      throw new BadRequestException('Prepared TRON action metadata is invalid');
    }

    input.action.status = PaymentWalletActionStatus.SUBMITTED;
    input.action.txId = input.dto.txId;
    input.action.txIdKind = input.dto.txIdKind;
    await input.manager.save(input.action);

    const tx = await this.alchemyService.getTronTransactionInfoById(input.dto.txId);
    if (!tx) {
      throw new BadRequestException('Submitted TRON transaction could not be fetched yet');
    }

    const reconciliation = this.tronPaymentExecutionService.reconcileSubmittedTx({
      prepared,
      tx,
    });
    if (reconciliation.status === 'invalid') {
      input.action.status = PaymentWalletActionStatus.CANCELLED;
      await input.manager.save(input.action);
      throw new BadRequestException(reconciliation.reason);
    }

    const nextPaymentStatus = PaymentStatus.CONFIRMING;
    const nextIntentStatus = this.stateService.toIntentStatus(nextPaymentStatus);
    const existing = await input.manager.findOne(PaymentEntity, { where: { intentId: input.intent.id } });
    const payment = input.manager.create(PaymentEntity, {
      ...(existing ?? {}),
      intentId: input.intent.id,
      chain: input.intent.chain,
      asset: input.intent.asset,
      amountBaseUnits: input.intent.expectedAmountBaseUnits,
      senderAddress: input.intent.senderAddress,
      receiverAddress: input.intent.receiverAddress,
      txHash: input.dto.txId,
      outputIndex: null,
      status: nextPaymentStatus,
      blockNumber: tx.blockNumber ? String(tx.blockNumber) : null,
      confirmations: 0,
      confirmedAt: null,
      rawPayload: {
        source: 'wallet_tx_result',
        preparedActionId: input.action.id,
        txIdKind: input.dto.txIdKind,
        reconciliation,
      },
    });
    await input.manager.save(payment);

    input.action.status = PaymentWalletActionStatus.USED;
    input.action.usedAt = new Date();
    await input.manager.save(input.action);

    this.stateService.assertIntentTransition(input.intent.status, nextIntentStatus);
    input.intent.status = nextIntentStatus;
    input.intent.lastCheckedAt = null;
    input.intent.lastCheckResult = {
      source: 'WALLET_TX_RESULT',
      status: nextPaymentStatus,
      txHash: input.dto.txId,
      reconciliation,
    };
    const savedIntent = await input.manager.save(input.intent);

    return {
      intent: savedIntent,
      payment,
      nextPaymentStatus,
      nextIntentStatus,
    };
  }
}
