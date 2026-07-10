import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TronWeb } from 'tronweb';

import { env } from '../../../infrastructure/config/env';
import type { TronTransactionInfo } from '../../alchemy/alchemy.service';

export const TRON_MAINNET_WALLET_CHAIN_ID = '0x2b6653dc';
export const TRON_TRANSFER_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const TRON_TX_HASH_PATTERN = /^[a-fA-F0-9]{64}$/;
const DEFAULT_TRON_FEE_LIMIT_SUN = '100000000';

export type TronPreparedTransfer = {
  kind: 'tron_transaction';
  network: 'mainnet';
  chainId: typeof TRON_MAINNET_WALLET_CHAIN_ID;
  walletActionId: string;
  contractAddress: string;
  functionSelector: 'transfer(address,uint256)';
  recipientAddress: string;
  amountBaseUnits: string;
  feeLimitSun: string;
  payerAddress: string;
  payerAddressHex: string;
};

export type TronTxReconciliationResult =
  | { status: 'matched' }
  | { status: 'invalid'; reason: string };

@Injectable()
export class TronPaymentExecutionService {
  normalizeTronAddress(address: string, label: string): string {
    const trimmed = address.trim();
    if (!trimmed || !TronWeb.isAddress(trimmed)) {
      throw new BadRequestException(`Invalid ${label}`);
    }

    return TronWeb.address.fromHex(TronWeb.address.toHex(trimmed));
  }

  toTronAddressHex(address: string, label: string): string {
    const normalized = this.normalizeTronAddress(address, label);
    return TronWeb.address.toHex(normalized);
  }

  buildPreparedTransfer(input: {
    payerAddress: string;
    recipientAddress: string;
    amountBaseUnits: string;
    contractAddress?: string;
    walletActionId?: string;
  }): TronPreparedTransfer {
    if (!/^[0-9]+$/.test(input.amountBaseUnits) || BigInt(input.amountBaseUnits) <= 0n) {
      throw new BadRequestException('USDT amount must be a positive base-unit integer');
    }

    const contractAddress = this.normalizeTronAddress(
      input.contractAddress ?? env.tronUsdtContractAddress,
      'TRON USDT contract address',
    );
    const recipientAddress = this.normalizeTronAddress(input.recipientAddress, 'recipientAddress');
    const payerAddress = this.normalizeTronAddress(input.payerAddress, 'payerAddress');

    return {
      kind: 'tron_transaction',
      network: 'mainnet',
      chainId: TRON_MAINNET_WALLET_CHAIN_ID,
      walletActionId: input.walletActionId ?? randomUUID(),
      contractAddress,
      functionSelector: 'transfer(address,uint256)',
      recipientAddress,
      amountBaseUnits: input.amountBaseUnits,
      feeLimitSun: DEFAULT_TRON_FEE_LIMIT_SUN,
      payerAddress,
      payerAddressHex: this.toTronAddressHex(payerAddress, 'payerAddress'),
    };
  }

  normalizeWalletChainId(value?: string | null): string {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (!normalized || normalized === TRON_MAINNET_WALLET_CHAIN_ID) {
      return TRON_MAINNET_WALLET_CHAIN_ID;
    }

    throw new BadRequestException('Wallet is connected to the wrong chain');
  }

  assertTxIdFormat(txId: string): void {
    if (!TRON_TX_HASH_PATTERN.test(txId)) {
      throw new BadRequestException('txId must be a 64-character TRON transaction hash');
    }
  }

  reconcileSubmittedTx(input: {
    prepared: TronPreparedTransfer;
    tx: TronTransactionInfo;
  }): TronTxReconciliationResult {
    const expected = {
      contractHex: this.toTronLogAddressHex(input.prepared.contractAddress, 'TRON USDT contract address'),
      senderHex: this.toTronLogAddressHex(input.prepared.payerAddress, 'TRON payerAddress'),
      receiverHex: this.toTronLogAddressHex(input.prepared.recipientAddress, 'TRON recipientAddress'),
      amountBaseUnits: input.prepared.amountBaseUnits,
    };

    for (const log of input.tx.logs) {
      const contractHex = this.normalizeTronLogAddressHex(log.address);
      if (contractHex !== expected.contractHex) {
        continue;
      }

      const transferTopic = this.normalizeHex(log.topics[0]);
      const senderHex = this.topicToTronLogAddressHex(log.topics[1]);
      const receiverHex = this.topicToTronLogAddressHex(log.topics[2]);
      const amountBaseUnits = this.parseTronLogUint256(log.data);

      if (
        transferTopic === TRON_TRANSFER_TOPIC
        && senderHex === expected.senderHex
        && receiverHex === expected.receiverHex
        && amountBaseUnits === expected.amountBaseUnits
      ) {
        return { status: 'matched' };
      }
    }

    return {
      status: 'invalid',
      reason: 'Submitted TRON transaction does not match the prepared USDT transfer',
    };
  }

  private toTronLogAddressHex(address: string, label: string): string {
    const normalized = this.normalizeTronAddress(address, label);
    return this.normalizeTronLogAddressHex(TronWeb.address.toHex(normalized));
  }

  private normalizeTronLogAddressHex(value: string | null | undefined): string {
    const normalized = this.normalizeHex(value);
    if (normalized.length === 42 && normalized.startsWith('41')) {
      return normalized.slice(2);
    }

    return normalized.length === 40 ? normalized : '';
  }

  private topicToTronLogAddressHex(value: string | null | undefined): string {
    const normalized = this.normalizeHex(value);
    return normalized.length >= 40 ? normalized.slice(-40) : '';
  }

  private normalizeHex(value: string | null | undefined): string {
    return (value ?? '').trim().replace(/^0x/iu, '').toLowerCase();
  }

  private parseTronLogUint256(value: string | null | undefined): string {
    const normalized = this.normalizeHex(value);
    if (!/^[0-9a-f]+$/u.test(normalized)) {
      return '0';
    }

    return BigInt(`0x${normalized}`).toString();
  }
}
