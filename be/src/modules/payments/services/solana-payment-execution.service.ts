import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import bs58 from 'bs58';

import { env } from '../../../infrastructure/config/env';

const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const SOLANA_SIGNATURE_LENGTH = 64;

async function loadSolanaWeb3() {
  return import('@solana/web3.js');
}

export type SolanaPreparedTransaction = {
  cluster: 'mainnet-beta';
  payer: string;
  recipientAddress: string;
  lamports: string;
  transactionBase64: string;
  transactionEncoding: 'base64';
  blockhash: string;
  lastValidBlockHeight: number;
  memoOrReference: string;
};

export type SolanaSignatureVerificationResult =
  | { status: 'not_found' }
  | { status: 'confirming'; confirmations: number }
  | {
      status: 'confirmed';
      confirmations: number;
      blockNumber: string | null;
      confirmedAt: Date | null;
      rawPayload: Record<string, unknown>;
    }
  | {
      status: 'invalid';
      reason: string;
      rawPayload: Record<string, unknown> | null;
    };

@Injectable()
export class SolanaPaymentExecutionService {
  buildConfig() {
    const rpcUrl = env.solanaRpcUrl.trim()
      || (env.alchemyApiKey ? `https://solana-mainnet.g.alchemy.com/v2/${env.alchemyApiKey}` : '');
    const recipientAddress = env.solTreasuryAddress.trim();

    if (!rpcUrl) {
      throw new ServiceUnavailableException('Solana RPC is not configured');
    }
    if (!recipientAddress) {
      throw new ServiceUnavailableException('Solana recipient address is not configured');
    }

    return {
      cluster: 'mainnet-beta' as const,
      rpcUrl,
      recipientAddress,
      minConfirmations: Math.max(1, env.solanaConfirmations),
      preparedActionTtlSeconds: Math.max(30, env.solanaPreparedActionTtlSeconds),
    };
  }

  normalizePublicKey(value: string, label = 'Solana address') {
    const trimmed = value.trim();
    try {
      if (bs58.decode(trimmed).length !== 32) {
        throw new Error('Invalid public key length');
      }
      return trimmed;
    } catch {
      throw new BadRequestException(`${label} must be a valid Solana public key`);
    }
  }

  isPlausibleSignature(value: string) {
    try {
      return bs58.decode(value).length === SOLANA_SIGNATURE_LENGTH;
    } catch {
      return false;
    }
  }

  async buildSolanaTransferAction(input: {
    payer: string;
    recipientAddress: string;
    lamports: string;
    memoOrReference: string;
  }): Promise<SolanaPreparedTransaction> {
    if (!/^[0-9]+$/.test(input.lamports) || BigInt(input.lamports) <= 0n) {
      throw new BadRequestException('SOL amount must be a positive lamport integer');
    }

    const config = this.buildConfig();
    const {
      Connection,
      PublicKey,
      SystemProgram,
      Transaction,
      TransactionInstruction,
    } = await loadSolanaWeb3();
    const connection = new Connection(config.rpcUrl, 'confirmed');
    const payer = new PublicKey(this.normalizePublicKey(input.payer, 'payer'));
    const recipient = new PublicKey(this.normalizePublicKey(input.recipientAddress, 'recipientAddress'));
    const reference = new PublicKey(this.normalizePublicKey(input.memoOrReference, 'memo/reference'));
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    const transaction = new Transaction();

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: recipient,
        lamports: BigInt(input.lamports),
      }),
    );
    transaction.add(
      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        keys: [{ pubkey: reference, isSigner: false, isWritable: false }],
        data: Buffer.from(input.memoOrReference, 'utf8'),
      }),
    );
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    transaction.feePayer = payer;

    return {
      cluster: config.cluster,
      payer: payer.toBase58(),
      recipientAddress: recipient.toBase58(),
      lamports: input.lamports,
      transactionBase64: transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
      transactionEncoding: 'base64',
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      memoOrReference: reference.toBase58(),
    };
  }

  async verifySolanaSignatureForIntent(input: {
    signature: string;
    payer: string;
    recipientAddress: string;
    lamports: string;
    memoOrReference: string;
  }): Promise<SolanaSignatureVerificationResult> {
    if (!this.isPlausibleSignature(input.signature)) {
      return { status: 'invalid', reason: 'Invalid Solana signature format', rawPayload: null };
    }

    const config = this.buildConfig();
    const { Connection } = await loadSolanaWeb3();
    const connection = new Connection(config.rpcUrl, 'confirmed');
    const [statusResponse, parsedTransaction] = await Promise.all([
      connection.getSignatureStatuses([input.signature], { searchTransactionHistory: true }),
      connection.getParsedTransaction(input.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      }),
    ]);
    const status = statusResponse.value[0];

    if (!status && !parsedTransaction) {
      return { status: 'not_found' };
    }
    if (status?.err) {
      return {
        status: 'invalid',
        reason: 'Solana transaction failed on-chain',
        rawPayload: this.toRecord(parsedTransaction),
      };
    }
    if (!parsedTransaction || status?.confirmationStatus !== 'finalized') {
      return {
        status: 'confirming',
        confirmations: typeof status?.confirmations === 'number' ? status.confirmations : 0,
      };
    }

    const transfer = this.findMatchingTransfer(parsedTransaction, input);
    if (!transfer.matched) {
      return {
        status: 'invalid',
        reason: transfer.reason,
        rawPayload: this.toRecord(parsedTransaction),
      };
    }

    return {
      status: 'confirmed',
      confirmations: config.minConfirmations,
      blockNumber: typeof parsedTransaction.slot === 'number' ? String(parsedTransaction.slot) : null,
      confirmedAt: typeof parsedTransaction.blockTime === 'number'
        ? new Date(parsedTransaction.blockTime * 1000)
        : new Date(),
      rawPayload: this.toRecord(parsedTransaction),
    };
  }

  private findMatchingTransfer(
    transaction: {
      transaction: {
        message: {
          instructions: unknown[];
          accountKeys: Array<{ pubkey: { toBase58: () => string } }>;
        };
      };
    } | null,
    input: {
      payer: string;
      recipientAddress: string;
      lamports: string;
      memoOrReference: string;
    },
  ): { matched: true } | { matched: false; reason: string } {
    const instructions = transaction?.transaction.message.instructions ?? [];
    const accountKeys = transaction?.transaction.message.accountKeys ?? [];
    const accountKeySet = new Set(accountKeys.map(key => key.pubkey.toBase58()));

    if (!accountKeySet.has(this.normalizePublicKey(input.memoOrReference, 'memo/reference'))) {
      return { matched: false, reason: 'Solana transaction is missing the payment reference' };
    }

    for (const instruction of instructions) {
      if (!instruction || typeof instruction !== 'object' || !('parsed' in instruction)) {
        continue;
      }

      const parsed = instruction.parsed as { type?: unknown; info?: Record<string, unknown> } | undefined;
      if (parsed?.type !== 'transfer' || !parsed.info) {
        continue;
      }

      if (String(parsed.info.source ?? '') !== this.normalizePublicKey(input.payer, 'payer')) {
        continue;
      }
      if (String(parsed.info.destination ?? '') !== this.normalizePublicKey(input.recipientAddress, 'recipientAddress')) {
        continue;
      }
      if (String(parsed.info.lamports ?? '') !== input.lamports) {
        return { matched: false, reason: 'Solana transaction amount does not match the payment intent' };
      }

      return { matched: true };
    }

    return { matched: false, reason: 'Solana transaction transfer does not match the payment intent' };
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return {};
    }

    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }
}
