import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../../infrastructure/config/env';

type EvmNetwork = 'eth-mainnet' | 'eth-sepolia' | 'base-sepolia';
type SolanaNetwork = 'solana-mainnet';
type BitcoinNetwork = 'bitcoin-mainnet';

type RpcErrorShape = {
  code?: unknown;
  message?: unknown;
};

type SimulateTransactionInput = {
  network: EvmNetwork;
  from: string;
  to: string;
  value?: string;
  data?: string;
};

type EvmTransfersInput = {
  fromAddress?: string;
  toAddress?: string;
  fromBlock?: string;
  toBlock?: string;
  pageKey?: string;
  maxCount?: string;
};

export type EvmTransfer = {
  hash: string;
  from: string | null;
  to: string | null;
  value: number | string | null;
  asset: string | null;
  rawContract?: {
    value?: string;
    decimal?: string;
  };
  blockNum?: string;
  metadata?: {
    blockTimestamp?: string;
  };
};

export type SolanaSignatureInfo = {
  signature: string;
  slot: number;
  err: unknown;
  blockTime: number | null;
};

export type SolanaParsedTransaction = Record<string, unknown>;

export type BitcoinAddressTransaction = {
  txid: string;
  confirmations: number;
  blockHeight: number | null;
  blockTime: number | null;
  outputs: Array<{
    index: number;
    address: string;
    valueSats: string;
  }>;
  raw: Record<string, unknown>;
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

function resolveEvmRpcUrl(network: EvmNetwork): string {
  const host = network === 'base-sepolia' ? 'base-sepolia' : network;
  return `https://${host}.g.alchemy.com/v2/${env.alchemyApiKey}`;
}

function resolveSolanaRpcUrl(_network: SolanaNetwork): string {
  return `https://solana-mainnet.g.alchemy.com/v2/${env.alchemyApiKey}`;
}

function resolveBitcoinRpcUrl(_network: BitcoinNetwork): string {
  return `https://bitcoin-mainnet.g.alchemy.com/v2/${env.alchemyApiKey}`;
}

function resolveBitcoinUtxoUrl(pathname: string): string {
  return `https://bitcoin-mainnet.g.alchemy.com/v2/${env.alchemyApiKey}${pathname}`;
}

@Injectable()
export class AlchemyService {
  private readonly logger = new Logger(AlchemyService.name);

  hasApiKey(): boolean {
    return Boolean(env.alchemyApiKey);
  }

  async getEthereumBlockNumber(): Promise<string | null> {
    const result = await this.callEvmRpc('eth-mainnet', 'eth_blockNumber', []);
    return typeof result === 'string' ? result : null;
  }

  async getEthereumAssetTransfers(input: EvmTransfersInput): Promise<{
    transfers: EvmTransfer[];
    pageKey: string | null;
  }> {
    if (!this.hasApiKey()) {
      return { transfers: [], pageKey: null };
    }

    const params: Record<string, unknown> = {
      fromBlock: input.fromBlock ?? '0x0',
      toBlock: input.toBlock ?? 'latest',
      category: ['external'],
      withMetadata: true,
      maxCount: input.maxCount ?? '0x64',
    };

    if (input.fromAddress) {
      params.fromAddress = input.fromAddress;
    }
    if (input.toAddress) {
      params.toAddress = input.toAddress;
    }
    if (input.pageKey) {
      params.pageKey = input.pageKey;
    }

    const response = await this.callEvmRpc('eth-mainnet', 'alchemy_getAssetTransfers', [params]);
    const transfers = Array.isArray((response as { transfers?: unknown[] })?.transfers)
      ? (response as { transfers: EvmTransfer[] }).transfers
      : [];
    const pageKey = (response as { pageKey?: unknown })?.pageKey;

    return {
      transfers,
      pageKey: typeof pageKey === 'string' ? pageKey : null,
    };
  }

  async getEthereumTransactionReceipt(txHash: string): Promise<TransactionReceiptResult | null> {
    return this.getTransactionReceipt('eth-mainnet', txHash);
  }

  async getSolanaSignaturesForAddress(address: string, limit = 20): Promise<SolanaSignatureInfo[]> {
    const result = await this.callSolanaRpc('getSignaturesForAddress', [
      address,
      { limit, commitment: 'finalized' },
    ]);

    if (!Array.isArray(result)) {
      return [];
    }

    return result
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(item => ({
        signature: String(item.signature ?? ''),
        slot: typeof item.slot === 'number' ? item.slot : 0,
        err: item.err ?? null,
        blockTime: typeof item.blockTime === 'number' ? item.blockTime : null,
      }))
      .filter(item => item.signature);
  }

  async getSolanaParsedTransaction(signature: string): Promise<SolanaParsedTransaction | null> {
    const result = await this.callSolanaRpc('getTransaction', [
      signature,
      {
        encoding: 'jsonParsed',
        commitment: 'finalized',
        maxSupportedTransactionVersion: 0,
      },
    ]);

    return result && typeof result === 'object' ? result as SolanaParsedTransaction : null;
  }

  async getBitcoinAddressTransactions(address: string): Promise<BitcoinAddressTransaction[]> {
    if (!this.hasApiKey()) {
      return [];
    }

    const payload = await this.callBitcoinRest(
      `/api/v2/address/${encodeURIComponent(address)}?details=txs&pageSize=20`,
    );
    const transactions = Array.isArray((payload as { transactions?: unknown[] })?.transactions)
      ? (payload as { transactions: Record<string, unknown>[] }).transactions
      : [];

    return transactions.map(tx => this.toBitcoinAddressTransaction(tx)).filter(Boolean);
  }

  async getBitcoinAddressSummary(address: string): Promise<{
    balance: string;
    totalReceived: string;
    unconfirmedBalance: string;
    txs: number;
  } | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    const payload = await this.callBitcoinRest(`/api/v2/address/${encodeURIComponent(address)}`);
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    return {
      balance: String((payload as { balance?: unknown }).balance ?? '0'),
      totalReceived: String((payload as { totalReceived?: unknown }).totalReceived ?? '0'),
      unconfirmedBalance: String((payload as { unconfirmedBalance?: unknown }).unconfirmedBalance ?? '0'),
      txs: Number((payload as { txs?: unknown }).txs ?? 0),
    };
  }

  private toBitcoinAddressTransaction(tx: Record<string, unknown>): BitcoinAddressTransaction {
    const txid = String(tx.txid ?? tx.txId ?? tx.hash ?? '');
    const confirmations = Number(tx.confirmations ?? 0);
    const blockHeight = typeof tx.blockHeight === 'number'
      ? tx.blockHeight
      : typeof tx.blockheight === 'number'
        ? tx.blockheight
        : null;
    const blockTime = typeof tx.blockTime === 'number'
      ? tx.blockTime
      : typeof tx.blocktime === 'number'
        ? tx.blocktime
        : null;
    const vout = Array.isArray(tx.vout) ? tx.vout : Array.isArray(tx.outputs) ? tx.outputs : [];
    const outputs = vout
      .map((output, index) => this.toBitcoinOutput(output, index))
      .filter((output): output is { index: number; address: string; valueSats: string } => Boolean(output));

    return {
      txid,
      confirmations,
      blockHeight,
      blockTime,
      outputs,
      raw: this.redactPayload(tx),
    };
  }

  private toBitcoinOutput(output: unknown, fallbackIndex: number): { index: number; address: string; valueSats: string } | null {
    if (!output || typeof output !== 'object') {
      return null;
    }

    const item = output as Record<string, unknown>;
    const addresses = Array.isArray(item.addresses) ? item.addresses : [];
    const address = typeof item.address === 'string'
      ? item.address
      : typeof item.scriptPubKey === 'object'
        && item.scriptPubKey
        && Array.isArray((item.scriptPubKey as { addresses?: unknown }).addresses)
          ? String(((item.scriptPubKey as { addresses: unknown[] }).addresses[0]) ?? '')
          : String(addresses[0] ?? '');

    const value = item.value;
    const valueSats = typeof value === 'number'
      ? Math.round(value * 100_000_000).toString()
      : typeof value === 'string' && value.includes('.')
        ? Math.round(Number(value) * 100_000_000).toString()
        : String(item.valueSat ?? item.satoshis ?? value ?? '0');

    if (!address) {
      return null;
    }

    return {
      index: Number(item.n ?? item.index ?? fallbackIndex),
      address,
      valueSats,
    };
  }

  async simulateTransaction(input: SimulateTransactionInput): Promise<{
    allowed: boolean;
    reason: string | null;
    raw: Record<string, unknown> | null;
  }> {
    if (!this.hasApiKey()) {
      return { allowed: false, reason: 'ALCHEMY_API_KEY_NOT_CONFIGURED', raw: null };
    }

    const response = await this.callEvmRpc(input.network, 'alchemy_simulateAssetChanges', [
      {
        from: input.from,
        to: input.to,
        value: this.toRpcQuantity(input.value),
        data: input.data,
      },
      'latest',
    ]);

    if (!response || typeof response !== 'object') {
      return { allowed: false, reason: 'SIMULATION_INVALID_RESPONSE', raw: null };
    }

    const simulationError = typeof (response as { error?: unknown }).error === 'object'
      && (response as { error?: unknown }).error
      ? (response as { error: unknown }).error
      : null;

    if (simulationError) {
      const simulationErrorMessage = this.extractRpcErrorMessage(simulationError);
      return {
        allowed: false,
        reason: simulationErrorMessage.includes('insufficient funds')
          ? 'SIMULATION_INSUFFICIENT_FUNDS'
          : this.isProviderInternalSimulationError(simulationError)
            ? 'SIMULATION_PROVIDER_INTERNAL_ERROR'
            : 'SIMULATION_REVERTED',
        raw: this.redactPayload(response),
      };
    }

    return { allowed: true, reason: null, raw: this.redactPayload(response) };
  }

  async getAssetTransfers(input: {
    network: EvmNetwork;
    address: string;
    fromBlock?: string;
    toBlock?: string;
    pageKey?: string;
  }): Promise<{ transfers: Array<Record<string, unknown>>; pageKey: string | null }> {
    const response = await this.getEthereumAssetTransfers({
      fromAddress: input.address,
      fromBlock: input.fromBlock,
      toBlock: input.toBlock,
      pageKey: input.pageKey,
    });

    return {
      transfers: response.transfers as unknown as Array<Record<string, unknown>>,
      pageKey: response.pageKey,
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

  async getTransactionByHash(network: EvmNetwork, txHash: string): Promise<TransactionByHashResult | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    const result = await this.callEvmRpc(network, 'eth_getTransactionByHash', [txHash]);
    if (!result || typeof result !== 'object') {
      return null;
    }

    const tx = result as Record<string, unknown>;
    const hash = typeof tx.hash === 'string' ? tx.hash : null;
    const from = typeof tx.from === 'string' ? tx.from : null;
    const to = typeof tx.to === 'string' ? tx.to : null;
    const value = typeof tx.value === 'string' ? tx.value : null;
    const blockNumber = typeof tx.blockNumber === 'string' ? tx.blockNumber : null;
    const input = typeof tx.input === 'string' ? tx.input : null;

    if (!hash || !from || !value) {
      return null;
    }

    return { hash, from, to, value, blockNumber, input };
  }

  async getTransactionReceipt(network: EvmNetwork, txHash: string): Promise<TransactionReceiptResult | null> {
    if (!this.hasApiKey()) {
      return null;
    }

    const result = await this.callEvmRpc(network, 'eth_getTransactionReceipt', [txHash]);
    if (!result || typeof result !== 'object') {
      return null;
    }

    const receipt = result as Record<string, unknown>;
    return {
      status: typeof receipt.status === 'string' ? receipt.status : null,
      blockNumber: typeof receipt.blockNumber === 'string' ? receipt.blockNumber : null,
      logs: Array.isArray(receipt.logs) ? receipt.logs as Array<Record<string, unknown>> : [],
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

    return trimmed;
  }

  private extractRpcErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error.toLowerCase();
    }

    if (!error || typeof error !== 'object') {
      return '';
    }

    const maybeError = error as RpcErrorShape;
    return typeof maybeError.message === 'string' ? maybeError.message.toLowerCase() : '';
  }

  private isProviderInternalSimulationError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as RpcErrorShape;
    const code = typeof maybeError.code === 'number' ? maybeError.code : null;
    const message = this.extractRpcErrorMessage(error);

    return code === -32603 || message.includes('bigint is not defined') || message.includes('internal error');
  }

  private async callEvmRpc(network: EvmNetwork, method: string, params: unknown[]): Promise<unknown> {
    return this.callRpc(resolveEvmRpcUrl(network), method, params);
  }

  private async callSolanaRpc(method: string, params: unknown[]): Promise<unknown> {
    return this.callRpc(resolveSolanaRpcUrl('solana-mainnet'), method, params);
  }

  private async callRpc(url: string, method: string, params: unknown[]): Promise<unknown> {
    if (!this.hasApiKey()) {
      return null;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: JSON_RPC_HEADERS,
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });

      const payload = await response.json() as { result?: unknown; error?: unknown };
      if (!response.ok || payload.error) {
        this.logger.warn(`Alchemy RPC ${method} failed`);
        return { error: payload.error ?? `HTTP_${response.status}` };
      }

      return payload.result ?? null;
    } catch (error) {
      this.logger.warn(`Alchemy RPC ${method} network failure: ${error instanceof Error ? error.message : 'unknown'}`);
      return { error: 'NETWORK_FAILURE' };
    }
  }

  private async callBitcoinRest(pathname: string): Promise<unknown> {
    try {
      const response = await fetch(resolveBitcoinUtxoUrl(pathname), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        this.logger.warn(`Alchemy Bitcoin UTXO request failed with status ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      this.logger.warn(`Alchemy Bitcoin UTXO network failure: ${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }

  private redactPayload(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    try {
      const json = JSON.stringify(payload).slice(0, 16_000);
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
