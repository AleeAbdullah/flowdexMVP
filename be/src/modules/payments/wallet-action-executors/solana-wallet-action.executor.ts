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
import { SolanaPaymentExecutionService } from '../services/solana-payment-execution.service';
import { PaymentStateService } from '../services/payment-state.service';
import { assertWalletIntentIsUsable } from './wallet-checkout.guards';
import type {
  WalletActionExecutor,
  WalletActionPrepareInput,
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
    private readonly _stateService: PaymentStateService,
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

  assertTxId(txIdKind: PaymentWalletTxIdKind, txId: string): void {
    if (txIdKind !== PaymentWalletTxIdKind.SOLANA_SIGNATURE || !SOLANA_SIGNATURE_PATTERN.test(txId)) {
      throw new BadRequestException('txId must be a base58 Solana signature');
    }
  }

  private normalizeSolanaWalletChainId(value?: string | null): string {
    const normalized = value?.trim() ?? '';
    if (!normalized || SOLANA_MAINNET_WALLET_CHAIN_ALIASES.has(normalized)) {
      return SOLANA_MAINNET_WALLET_CHAIN_ID;
    }

    throw new BadRequestException('Unsupported Solana wallet chain.');
  }
}
