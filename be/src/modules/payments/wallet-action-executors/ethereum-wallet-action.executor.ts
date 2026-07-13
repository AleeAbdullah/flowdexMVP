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
import { EvmPaymentExecutionService } from '../services/evm-payment-execution.service';
import { PaymentStateService } from '../services/payment-state.service';
import { assertWalletIntentIsUsable } from './wallet-checkout.guards';
import type {
  WalletActionExecutor,
  WalletActionPrepareInput,
} from './wallet-action-executor.types';

const ETHEREUM_MAINNET_CHAIN_ID = 1;
const PAYMENT_WALLET_ACTION_TTL_MS = 5 * 60 * 1000;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

@Injectable()
export class EthereumWalletActionExecutor implements WalletActionExecutor {
  readonly chain = PaymentChain.ETHEREUM;

  constructor(
    @InjectRepository(PaymentWalletActionEntity)
    private readonly paymentWalletActionsRepository: Repository<PaymentWalletActionEntity>,
    private readonly evmPaymentExecutionService: EvmPaymentExecutionService,
    private readonly _stateService: PaymentStateService,
  ) {}

  async prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto> {
    const walletChainId = this.normalizeWalletChainId(input.dto.walletChainId);
    if (walletChainId !== null && walletChainId !== ETHEREUM_MAINNET_CHAIN_ID) {
      throw new BadRequestException('Wallet is connected to the wrong chain');
    }

    assertWalletIntentIsUsable(input.intent, input.senderAddress, PaymentChain.ETHEREUM);

    const request = this.evmPaymentExecutionService.buildNativeEthPaymentRequest({
      receiverAddress: input.intent.receiverAddress,
      amountBaseUnits: input.intent.expectedAmountBaseUnits,
      chainId: ETHEREUM_MAINNET_CHAIN_ID,
    });
    const expiresAt = new Date(Date.now() + PAYMENT_WALLET_ACTION_TTL_MS);
    const action = await this.paymentWalletActionsRepository.save(
      this.paymentWalletActionsRepository.create({
        paymentIntentId: input.intent.id,
        chain: PaymentChain.ETHEREUM,
        actionKind: PaymentWalletActionKind.EVM_TRANSACTION,
        senderAddress: input.senderAddress,
        walletChainId: walletChainId === null ? null : String(walletChainId),
        status: PaymentWalletActionStatus.PREPARED,
        requestJson: request,
        expiresAt,
        usedAt: null,
        txId: null,
        txIdKind: null,
      }),
    );

    return {
      kind: PaymentWalletActionKind.EVM_TRANSACTION,
      paymentIntentId: input.intent.id,
      preparedActionId: action.id,
      chain: PaymentChain.ETHEREUM,
      chainId: request.chainId,
      request,
      expiresAt: action.expiresAt,
    };
  }

  assertTxId(txIdKind: PaymentWalletTxIdKind, txId: string): void {
    if (txIdKind !== PaymentWalletTxIdKind.EVM_TX_HASH || !TX_HASH_PATTERN.test(txId)) {
      throw new BadRequestException('txId must be a 32-byte EVM transaction hash');
    }
  }

  private normalizeWalletChainId(value: string | number | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = typeof value === 'number'
      ? value
      : value.startsWith('0x')
        ? Number.parseInt(value, 16)
        : Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('walletChainId must be a valid chain id');
    }

    return parsed;
  }
}
