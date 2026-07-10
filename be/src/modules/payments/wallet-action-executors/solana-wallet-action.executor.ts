import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
import { SolanaPaymentExecutionService } from '../services/solana-payment-execution.service';
import { PaymentStateService } from '../services/payment-state.service';
import { assertWalletActionIsUsable, assertWalletIntentIsUsable } from './wallet-checkout.guards';
import type {
  WalletActionExecutor,
  WalletActionPrepareInput,
  WalletActionSubmitInput,
  WalletActionSubmitResult,
} from './wallet-action-executor.types';

export const SOLANA_MAINNET_WALLET_CHAIN_ID = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const SOLANA_MAINNET_WALLET_CHAIN_ALIASES = new Set([
  SOLANA_MAINNET_WALLET_CHAIN_ID,
  'solana:mainnet',
  'solana:mainnet-beta',
  'mainnet',
  'mainnet-beta',
]);
const SOLANA_SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;

@Injectable()
export class SolanaWalletActionExecutor implements WalletActionExecutor {
  readonly chain = PaymentChain.SOLANA;

  constructor(
    @InjectRepository(PaymentWalletActionEntity)
    private readonly paymentWalletActionsRepository: Repository<PaymentWalletActionEntity>,
    private readonly solanaPaymentExecutionService: SolanaPaymentExecutionService,
    private readonly stateService: PaymentStateService,
  ) {}

  async prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto> {
    const requestedWalletChainId = typeof input.dto.walletChainId === 'string' ? input.dto.walletChainId : null;
    const walletChainId = this.normalizeSolanaWalletChainId(requestedWalletChainId);

    assertWalletIntentIsUsable(input.intent, input.senderAddress, PaymentChain.SOLANA);

    const config = this.solanaPaymentExecutionService.buildConfig();
    const prepared = await this.solanaPaymentExecutionService.buildSolanaTransferAction({
      payer: input.senderAddress,
      recipientAddress: config.recipientAddress,
      lamports: input.intent.expectedAmountBaseUnits,
      memoOrReference: input.intent.solanaReference ?? input.intent.id,
    });
    const expiresAt = new Date(Date.now() + config.preparedActionTtlSeconds * 1000);
    const requestJson = {
      cluster: prepared.cluster,
      payer: prepared.payer,
      recipientAddress: prepared.recipientAddress,
      lamports: prepared.lamports,
      transactionEncoding: prepared.transactionEncoding,
      transactionBase64: prepared.transactionBase64,
      blockhash: prepared.blockhash,
      lastValidBlockHeight: prepared.lastValidBlockHeight,
      memoOrReference: prepared.memoOrReference,
      walletChainId,
      requestedWalletChainId,
    };
    const action = await this.paymentWalletActionsRepository.save(
      this.paymentWalletActionsRepository.create({
        paymentIntentId: input.intent.id,
        chain: PaymentChain.SOLANA,
        actionKind: PaymentWalletActionKind.SOLANA_TRANSACTION,
        senderAddress: input.senderAddress,
        walletChainId,
        status: PaymentWalletActionStatus.PREPARED,
        requestJson,
        expiresAt,
        usedAt: null,
        txId: null,
        txIdKind: null,
      }),
    );

    return {
      kind: PaymentWalletActionKind.SOLANA_TRANSACTION,
      paymentIntentId: input.intent.id,
      preparedActionId: action.id,
      chain: PaymentChain.SOLANA,
      cluster: prepared.cluster,
      walletChainId,
      payer: prepared.payer,
      transaction: prepared.transactionBase64,
      transactionEncoding: prepared.transactionEncoding,
      expiresAt: action.expiresAt,
      lastValidBlockHeight: prepared.lastValidBlockHeight,
    };
  }

  async submitTxResult(input: WalletActionSubmitInput): Promise<WalletActionSubmitResult> {
    if (input.dto.txIdKind !== PaymentWalletTxIdKind.SOLANA_SIGNATURE) {
      throw new BadRequestException('SOL wallet checkout requires a Solana signature');
    }
    if (!SOLANA_SIGNATURE_PATTERN.test(input.dto.txId)) {
      throw new BadRequestException('txId must be a base58 Solana signature');
    }

    assertWalletActionIsUsable(input.action, input.wallet.normalized, PaymentChain.SOLANA);

    input.action.status = PaymentWalletActionStatus.SUBMITTED;
    input.action.usedAt = new Date();
    input.action.txId = input.dto.txId;
    input.action.txIdKind = input.dto.txIdKind;
    await input.manager.save(input.action);

    const solanaVerification = await this.verifySolanaWalletAction(input.action, input.dto.txId);
    const nextPaymentStatus = solanaVerification?.status === 'confirmed'
      ? PaymentStatus.CONFIRMED
      : solanaVerification?.status === 'invalid'
        ? PaymentStatus.FAILED
        : PaymentStatus.CONFIRMING;
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
      blockNumber: solanaVerification?.status === 'confirmed' ? solanaVerification.blockNumber : null,
      confirmations: solanaVerification?.status === 'confirmed' || solanaVerification?.status === 'confirming'
        ? solanaVerification.confirmations
        : 0,
      confirmedAt: solanaVerification?.status === 'confirmed' ? solanaVerification.confirmedAt : null,
      rawPayload: {
        source: 'wallet_tx_result',
        preparedActionId: input.action.id,
        txIdKind: input.dto.txIdKind,
        verification: solanaVerification,
      },
    });
    await input.manager.save(payment);

    input.action.status = PaymentWalletActionStatus.USED;
    await input.manager.save(input.action);

    this.stateService.assertIntentTransition(input.intent.status, nextIntentStatus);
    input.intent.status = nextIntentStatus;
    input.intent.lastCheckedAt = solanaVerification?.status === 'confirmed' || solanaVerification?.status === 'invalid'
      ? new Date()
      : null;
    input.intent.lastCheckResult = {
      source: 'WALLET_TX_RESULT',
      status: nextPaymentStatus,
      txHash: input.dto.txId,
      verification: solanaVerification,
    };
    const savedIntent = await input.manager.save(input.intent);

    return {
      intent: savedIntent,
      payment,
      nextPaymentStatus,
      nextIntentStatus,
    };
  }

  private normalizeSolanaWalletChainId(value?: string | null): string {
    const normalized = value?.trim() ?? '';
    if (!normalized || SOLANA_MAINNET_WALLET_CHAIN_ALIASES.has(normalized)) {
      return SOLANA_MAINNET_WALLET_CHAIN_ID;
    }

    throw new BadRequestException('Unsupported Solana wallet chain.');
  }

  private async verifySolanaWalletAction(action: PaymentWalletActionEntity, signature: string) {
    const request = action.requestJson;
    const payer = typeof request.payer === 'string' ? request.payer : action.senderAddress;
    const recipientAddress = typeof request.recipientAddress === 'string' ? request.recipientAddress : '';
    const lamports = typeof request.lamports === 'string' ? request.lamports : '';
    const memoOrReference = typeof request.memoOrReference === 'string' ? request.memoOrReference : '';

    if (!payer || !recipientAddress || !lamports || !memoOrReference) {
      return {
        status: 'invalid' as const,
        reason: 'Prepared Solana action metadata is incomplete',
        rawPayload: null,
      };
    }

    return this.solanaPaymentExecutionService.verifySolanaSignatureForIntent({
      signature,
      payer,
      recipientAddress,
      lamports,
      memoOrReference,
    });
  }
}
