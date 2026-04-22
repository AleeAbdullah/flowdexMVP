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

type TransfersInput = {
  network: AlchemyNetwork;
  address: string;
  fromBlock?: string;
  toBlock?: string;
  pageKey?: string;
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
        value: input.value,
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
      return {
        allowed: false,
        reason: 'SIMULATION_REVERTED',
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
