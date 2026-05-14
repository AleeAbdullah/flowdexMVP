import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../../infrastructure/config/env';

type AlchemyNetwork = 'eth-sepolia' | 'base-sepolia';

type SimulateTransactionInput = {
  network: AlchemyNetwork;
  from: string;
  to: string;
  value?: string;
  data?: string;
};

type RpcErrorShape = {
  code?: unknown;
  message?: unknown;
};

type TransfersInput = {
  network: AlchemyNetwork;
  address: string;
  fromBlock?: string;
  toBlock?: string;
  pageKey?: string;
};

type TransactionByHashResult = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  blockNumber: string | null;
  input: string | null;
};

type TransactionReceiptResult = {
  status: string | null;
  blockNumber: string | null;
  logs: Array<Record<string, unknown>>;
};

const JSON_RPC_HEADERS = {
  'Content-Type': 'application/json',
} as const;

function resolveRpcUrl(network: AlchemyNetwork): string {
  const prefix = network === 'base-sepolia' ? 'base-sepolia' : 'eth-sepolia';
  return `https://${prefix}.g.alchemy.com/v2/${env.alchemyApiKey}`;
}

@Injectable()
export class AlchemyService {
  private readonly logger = new Logger(AlchemyService.name);

  hasApiKey(): boolean {
    return Boolean(env.alchemyApiKey);
  }

  async simulateTransaction(input: SimulateTransactionInput): Promise<{
    allowed: boolean;
    reason: string | null;
    raw: Record<string, unknown> | null;
  }> {
    if (!this.hasApiKey()) {
      return {
        allowed: false,
        reason: 'ALCHEMY_API_KEY_NOT_CONFIGURED',
        raw: null,
      };
    }

    const response = await this.callRpc(input.network, 'alchemy_simulateAssetChanges', [
      {
        from: input.from,
        to: input.to,
        value: this.toRpcQuantity(input.value),
        data: input.data,
      },
      'latest',
    ]);

    if (!response || typeof response !== 'object') {
      return {
        allowed: false,
        reason: 'SIMULATION_INVALID_RESPONSE',
        raw: null,
      };
    }

    const simulationError = typeof (response as { error?: unknown }).error === 'object'
      && (response as { error?: unknown }).error
      ? (response as { error: unknown }).error
      : null;

    if (simulationError) {
      const fallback = await this.simulateViaEstimateGasIfPossible(input, simulationError);
      if (fallback) {
        return fallback;
      }

      const simulationErrorMessage = this.extractRpcErrorMessage(simulationError);
      return {
        allowed: false,
        reason: simulationErrorMessage.includes('insufficient funds')
          ? 'SIMULATION_INSUFFICIENT_FUNDS'
          : this.isProviderInternalSimulationError(simulationError)
            ? 'SIMULATION_PROVIDER_INTERNAL_ERROR'
            : 'SIMULATION_REVERTED',
        raw: response,
      };
    }

    const changes = Array.isArray((response as { changes?: unknown[] }).changes)
      ? (response as { changes: unknown[] }).changes
      : [];

    if (changes.length === 0) {
      return {
        allowed: false,
        reason: 'SIMULATION_NO_ASSET_CHANGE',
        raw: response,
      };
    }

    return {
      allowed: true,
      reason: null,
      raw: response,
    };
  }

  private toRpcQuantity(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      return trimmed;
    }

    if (/^[0-9]+$/.test(trimmed)) {
      return `0x${BigInt(trimmed).toString(16)}`;
    }

    // Let upstream simulation return a clear validation error for unsupported formats.
    return trimmed;
  }

  private async simulateViaEstimateGasIfPossible(
    input: SimulateTransactionInput,
    simulationError: unknown,
  ): Promise<{
    allowed: boolean;
    reason: string | null;
    raw: Record<string, unknown> | null;
  } | null> {
    if (!this.isProviderInternalSimulationError(simulationError)) {
      return null;
    }

    const estimateResponse = await this.callRpc(input.network, 'eth_estimateGas', [
      {
        from: input.from,
        to: input.to,
        value: this.toRpcQuantity(input.value),
        data: input.data,
      },
    ]);

    if (!estimateResponse || typeof estimateResponse !== 'object') {
      return {
        allowed: false,
        reason: 'SIMULATION_PROVIDER_INTERNAL_ERROR',
        raw: {
          simulationError,
          estimateGas: estimateResponse,
        },
      };
    }

    const estimateError = typeof (estimateResponse as { error?: unknown }).error === 'object'
      && (estimateResponse as { error?: unknown }).error
      ? (estimateResponse as { error: unknown }).error
      : null;

    if (estimateError) {
      const estimateErrorMessage = this.extractRpcErrorMessage(estimateError);
      return {
        allowed: false,
        reason: estimateErrorMessage.includes('insufficient funds')
          ? 'SIMULATION_INSUFFICIENT_FUNDS'
          : 'SIMULATION_REVERTED',
        raw: {
          simulationError,
          estimateGas: estimateResponse,
        },
      };
    }

    return {
      allowed: true,
      reason: null,
      raw: {
        simulationError,
        estimateGas: estimateResponse,
      },
    };
  }

  private extractRpcErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error.toLowerCase();
    }

    if (!error || typeof error !== 'object') {
      return '';
    }

    const maybeError = error as RpcErrorShape;
    return typeof maybeError.message === 'string'
      ? maybeError.message.toLowerCase()
      : '';
  }

  private isProviderInternalSimulationError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as RpcErrorShape;
    const code = typeof maybeError.code === 'number' ? maybeError.code : null;
    const message = this.extractRpcErrorMessage(error);

    return code === -32603
      || message.includes('bigint is not defined')
      || message.includes('internal error');
  }

  async getAssetTransfers(input: TransfersInput): Promise<{
    transfers: Array<Record<string, unknown>>;
    pageKey: string | null;
  }> {
    if (!this.hasApiKey()) {
      return { transfers: [], pageKey: null };
    }

    const [incoming, outgoing] = await Promise.all([
      this.callRpc(input.network, 'alchemy_getAssetTransfers', [
        {
          fromBlock: input.fromBlock ?? '0x0',
          toBlock: input.toBlock ?? 'latest',
          toAddress: input.address,
          category: ['external', 'erc20'],
          withMetadata: true,
          maxCount: '0x64',
          pageKey: input.pageKey,
        },
      ]),
      this.callRpc(input.network, 'alchemy_getAssetTransfers', [
        {
          fromBlock: input.fromBlock ?? '0x0',
          toBlock: input.toBlock ?? 'latest',
          fromAddress: input.address,
          category: ['external', 'erc20'],
          withMetadata: true,
          maxCount: '0x64',
          pageKey: input.pageKey,
        },
      ]),
    ]);

    const incomingTransfers = Array.isArray((incoming as { transfers?: unknown[] })?.transfers)
      ? (incoming as { transfers: Array<Record<string, unknown>> }).transfers
      : [];
    const outgoingTransfers = Array.isArray((outgoing as { transfers?: unknown[] })?.transfers)
      ? (outgoing as { transfers: Array<Record<string, unknown>> }).transfers
      : [];
    const pageKey = (incoming as { pageKey?: unknown })?.pageKey;

    return {
      transfers: [...incomingTransfers, ...outgoingTransfers],
      pageKey: typeof pageKey === 'string' ? pageKey : null,
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!env.alchemyWebhookSigningKey || !signature) {
      return false;
    }

    const computed = createHmac('sha256', env.alchemyWebhookSigningKey)
      .update(rawBody)
      .digest('hex');

    const left = Buffer.from(computed, 'utf8');
    const right = Buffer.from(signature, 'utf8');

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }

  async getTransactionByHash(
    network: AlchemyNetwork,
    txHash: string,
  ): Promise<TransactionByHashResult | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    const result = await this.callRpc(network, 'eth_getTransactionByHash', [txHash]);
    if (!result) {
      return null;
    }

    const hash = typeof result.hash === 'string' ? result.hash : null;
    const from = typeof result.from === 'string' ? result.from : null;
    const to = typeof result.to === 'string' ? result.to : null;
    const value = typeof result.value === 'string' ? result.value : null;
    const blockNumber = typeof result.blockNumber === 'string' ? result.blockNumber : null;
    const input = typeof result.input === 'string' ? result.input : null;

    if (!hash || !from || !value) {
      return null;
    }

    return {
      hash,
      from,
      to,
      value,
      blockNumber,
      input,
    };
  }

  async getTransactionReceipt(
    network: AlchemyNetwork,
    txHash: string,
  ): Promise<TransactionReceiptResult | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    const result = await this.callRpc(network, 'eth_getTransactionReceipt', [txHash]);
    if (!result) {
      return null;
    }

    return {
      status: typeof result.status === 'string' ? result.status : null,
      blockNumber: typeof result.blockNumber === 'string' ? result.blockNumber : null,
      logs: Array.isArray(result.logs) ? result.logs as Array<Record<string, unknown>> : [],
    };
  }

  private async callRpc(
    network: AlchemyNetwork,
    method: string,
    params: unknown[],
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(resolveRpcUrl(network), {
        method: 'POST',
        headers: JSON_RPC_HEADERS,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
      });

      const payload = await response.json() as {
        result?: Record<string, unknown>;
        error?: unknown;
      };

      if (!response.ok || payload.error) {
        this.logger.warn(`Alchemy RPC ${method} failed on ${network}`);
        return {
          error: payload.error ?? `HTTP_${response.status}`,
        };
      }

      return payload.result ?? null;
    } catch (error) {
      this.logger.warn(
        `Alchemy RPC ${method} network failure: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return {
        error: 'NETWORK_FAILURE',
      };
    }
  }
}
