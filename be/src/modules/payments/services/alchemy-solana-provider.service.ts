import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { Connection } from '@solana/web3.js';

import { env } from '../../../infrastructure/config/env';

const SOLANA_COMMITMENT = 'confirmed';
const ALCHEMY_SOLANA_MAINNET_RPC_URL = 'https://solana-mainnet.g.alchemy.com/v2';

export const SOLANA_WALLET_CHECKOUT_UNAVAILABLE = 'SOLANA_WALLET_CHECKOUT_UNAVAILABLE';
export const SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE = 'Solana wallet checkout is temporarily unavailable. Please try again later.';

export type AlchemySolanaLatestBlockhash = {
  blockhash: string;
  lastValidBlockHeight: number;
};

export type AlchemySolanaSignatureStatus = {
  err?: unknown;
  confirmations?: number | null;
  confirmationStatus?: string | null;
} | null;

export type AlchemySolanaParsedTransaction = {
  slot?: number;
  blockTime?: number | null;
  transaction: {
    message: {
      instructions: unknown[];
      accountKeys: Array<{ pubkey: { toBase58: () => string } }>;
    };
  };
} | null;

export function createSolanaWalletCheckoutUnavailableException() {
  return new ServiceUnavailableException({
    statusCode: 503,
    error: 'Service Unavailable',
    code: SOLANA_WALLET_CHECKOUT_UNAVAILABLE,
    message: SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE,
  });
}

@Injectable()
export class AlchemySolanaProvider {
  private readonly logger = new Logger(AlchemySolanaProvider.name);
  private connection: Connection | null = null;
  private connectionRpcUrl = '';

  async getLatestBlockhash(): Promise<AlchemySolanaLatestBlockhash> {
    try {
      return await (await this.getConnection()).getLatestBlockhash(SOLANA_COMMITMENT);
    } catch (error) {
      throw this.toSolanaProviderUnavailableException(error, 'getLatestBlockhash');
    }
  }

  async getSignatureStatuses(signatures: string[]): Promise<AlchemySolanaSignatureStatus[]> {
    try {
      const response = await (await this.getConnection()).getSignatureStatuses(signatures, {
        searchTransactionHistory: true,
      });

      return response.value as AlchemySolanaSignatureStatus[];
    } catch (error) {
      throw this.toSolanaProviderUnavailableException(error, 'getSignatureStatuses');
    }
  }

  async getSignatureStatus(signature: string): Promise<AlchemySolanaSignatureStatus> {
    const statuses = await this.getSignatureStatuses([signature]);
    return statuses[0] ?? null;
  }

  async getParsedTransaction(signature: string): Promise<AlchemySolanaParsedTransaction> {
    try {
      return await (await this.getConnection()).getParsedTransaction(signature, {
        commitment: SOLANA_COMMITMENT,
        maxSupportedTransactionVersion: 0,
      }) as AlchemySolanaParsedTransaction;
    } catch (error) {
      throw this.toSolanaProviderUnavailableException(error, 'getParsedTransaction');
    }
  }

  private async getConnection(): Promise<Connection> {
    const apiKey = env.alchemyApiKey.trim();
    const rpcUrl = apiKey ? `${ALCHEMY_SOLANA_MAINNET_RPC_URL}/${apiKey}` : '';
    if (!rpcUrl) {
      this.logger.error('Alchemy Solana provider is not configured: missing ALCHEMY_API_KEY');
      throw createSolanaWalletCheckoutUnavailableException();
    }

    if (this.connection && this.connectionRpcUrl === rpcUrl) {
      return this.connection;
    }

    try {
      const { Connection } = await import('@solana/web3.js');
      this.connection = new Connection(rpcUrl, SOLANA_COMMITMENT);
      this.connectionRpcUrl = rpcUrl;

      return this.connection;
    } catch (error) {
      throw this.toSolanaProviderUnavailableException(error, 'createConnection');
    }
  }

  private toSolanaProviderUnavailableException(error: unknown, operation: string) {
    if (error instanceof ServiceUnavailableException) {
      return error;
    }

    this.logger.error(
      `Alchemy Solana provider failed during ${operation}`,
      error instanceof Error ? error.stack : String(error),
    );

    return createSolanaWalletCheckoutUnavailableException();
  }
}
