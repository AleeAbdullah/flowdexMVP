import { isAddress, isHex } from 'viem';
import type { IWalletTransactionRequest } from '@/dal/app/transactions/transactions.types';
import { normalizeWalletAddress } from './buy-display';

type ValidationErrorReason =
  | 'missing_provider'
  | 'provider_disconnected'
  | 'wrong_chain'
  | 'account_mismatch'
  | 'unsupported_method'
  | 'rpc_error';

export class BuyTransactionValidationError extends Error {
  constructor(
    readonly reason: ValidationErrorReason,
    message: string,
    readonly originalCode?: number | string,
  ) {
    super(message);
    this.name = 'BuyTransactionValidationError';
  }
}

function isHexQuantity(value: string) {
  return /^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/u.test(value);
}

function assertHexQuantity(value: string, label: string) {
  if (!isHexQuantity(value)) {
    throw new BuyTransactionValidationError('rpc_error', `${label} must be a valid hex quantity.`);
  }
}

export function validateBuySimulationRequest(request: IWalletTransactionRequest) {
  if (!isAddress(request.to)) {
    throw new BuyTransactionValidationError('rpc_error', 'Simulation returned an invalid recipient address.');
  }

  assertHexQuantity(request.value, 'Simulation value');

  if (!isHex(request.data, { strict: true })) {
    throw new BuyTransactionValidationError('rpc_error', 'Simulation returned invalid transaction data.');
  }

  if (request.gas) {
    assertHexQuantity(request.gas, 'Simulation gas');
  }
  if (request.gasPrice) {
    assertHexQuantity(request.gasPrice, 'Simulation gasPrice');
  }
  if (request.maxFeePerGas) {
    assertHexQuantity(request.maxFeePerGas, 'Simulation maxFeePerGas');
  }
  if (request.maxPriorityFeePerGas) {
    assertHexQuantity(request.maxPriorityFeePerGas, 'Simulation maxPriorityFeePerGas');
  }

  if (request.gasPrice && (request.maxFeePerGas || request.maxPriorityFeePerGas)) {
    throw new BuyTransactionValidationError(
      'rpc_error',
      'Simulation returned mixed legacy and EIP-1559 gas fields.',
    );
  }

  if (!Number.isInteger(request.chainId) || request.chainId <= 0) {
    throw new BuyTransactionValidationError('rpc_error', 'Simulation returned an invalid chain id.');
  }
}

export function assertSimulationMatchesWallet(input: {
  request: IWalletTransactionRequest;
  connectedAddress: string | null;
  verifiedWalletAddress: string | null;
  activeChainId: number | null;
}) {
  validateBuySimulationRequest(input.request);

  const normalizedConnectedAddress = normalizeWalletAddress(input.connectedAddress);
  const normalizedVerifiedWalletAddress = normalizeWalletAddress(input.verifiedWalletAddress);

  if (!normalizedConnectedAddress) {
    throw new BuyTransactionValidationError('provider_disconnected', 'The wallet disconnected before the transaction could be sent.');
  }

  if (!normalizedVerifiedWalletAddress || normalizedConnectedAddress !== normalizedVerifiedWalletAddress) {
    throw new BuyTransactionValidationError('account_mismatch', 'The connected wallet no longer matches the verified wallet.');
  }

  if (!input.activeChainId || input.activeChainId !== input.request.chainId) {
    throw new BuyTransactionValidationError('wrong_chain', 'The connected wallet is on the wrong network for this checkout.');
  }
}

export function buildWalletRpcTransaction(input: {
  connectedAddress: `0x${string}`;
  request: IWalletTransactionRequest;
}) {
  validateBuySimulationRequest(input.request);

  return {
    from: input.connectedAddress,
    to: input.request.to,
    value: input.request.value,
    data: input.request.data,
    ...(input.request.gas ? { gas: input.request.gas } : {}),
    ...(input.request.gasPrice ? { gasPrice: input.request.gasPrice } : {}),
    ...(input.request.maxFeePerGas ? { maxFeePerGas: input.request.maxFeePerGas } : {}),
    ...(input.request.maxPriorityFeePerGas
      ? { maxPriorityFeePerGas: input.request.maxPriorityFeePerGas }
      : {}),
  };
}
