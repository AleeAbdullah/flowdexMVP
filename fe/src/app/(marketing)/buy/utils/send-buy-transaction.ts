import type { Connector } from '@wagmi/core';
import { getAddress } from 'viem';
import type { IPaymentWalletTransactionRequest } from '@/dal/app/payments/payments.types';
import { assertSimulationMatchesWallet, buildWalletRpcTransaction, BuyTransactionValidationError } from './buy-transaction-validation';
import { normalizeProviderError } from './normalize-provider-error';
import type { BuyWalletProvider, NormalizedBuySendError } from './buy-transaction.types';

function normalizeChainId(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      return Number.parseInt(value, 16);
    }

    return Number.parseInt(value, 10);
  }

  return Number.NaN;
}

async function readCurrentWalletState(provider: BuyWalletProvider) {
  const [accounts, chainIdValue] = await Promise.all([
    provider.request({ method: 'eth_accounts' }),
    provider.request({ method: 'eth_chainId' }),
  ]);

  const account = Array.isArray(accounts) && typeof accounts[0] === 'string'
    ? getAddress(accounts[0])
    : null;
  const chainId = normalizeChainId(chainIdValue);

  if (!account) {
    throw new BuyTransactionValidationError(
      'provider_disconnected',
      'The wallet disconnected before the transaction could be sent.',
    );
  }

  if (!Number.isInteger(chainId)) {
    throw new BuyTransactionValidationError(
      'wrong_chain',
      'The wallet did not report a usable chain id for checkout.',
    );
  }

  return {
    account,
    chainId,
  };
}

export async function sendBuyTransaction(input: {
  connector: Connector;
  connectedAddress: `0x${string}`;
  verifiedWalletAddress: string;
  request: IPaymentWalletTransactionRequest;
}): Promise<{ txHash: `0x${string}` } | { error: NormalizedBuySendError }> {
  try {
    const provider = await input.connector.getProvider().catch(() => null) as BuyWalletProvider | null;
    if (!provider || typeof provider.request !== 'function') {
      throw new BuyTransactionValidationError(
        'missing_provider',
        'A compatible wallet provider is not available for checkout.',
      );
    }

    const currentWalletState = await readCurrentWalletState(provider);
    assertSimulationMatchesWallet({
      request: input.request,
      connectedAddress: currentWalletState.account,
      verifiedWalletAddress: input.verifiedWalletAddress,
      activeChainId: currentWalletState.chainId,
    });

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [buildWalletRpcTransaction({
        connectedAddress: currentWalletState.account,
        request: input.request,
      })],
    });

    if (typeof txHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/u.test(txHash)) {
      throw new BuyTransactionValidationError(
        'rpc_error',
        'The wallet returned an invalid transaction hash.',
      );
    }

    return {
      txHash: txHash as `0x${string}`,
    };
  } catch (error) {
    return {
      error: normalizeProviderError(error),
    };
  }
}
