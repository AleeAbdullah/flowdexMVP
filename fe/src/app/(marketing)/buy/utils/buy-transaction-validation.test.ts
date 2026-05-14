import { describe, expect, it } from 'vitest';
import {
  assertSimulationMatchesWallet,
  buildWalletRpcTransaction,
  BuyTransactionValidationError,
  validateBuySimulationRequest,
} from './buy-transaction-validation';

const baseRequest = {
  chainId: 11155111,
  to: '0x1111111111111111111111111111111111111111' as const,
  value: '0x2386f26fc10000' as const,
  data: '0x' as const,
};

describe('buy transaction validation', () => {
  it('rejects mixed legacy and EIP-1559 gas fields', () => {
    expect(() => validateBuySimulationRequest({
      ...baseRequest,
      gasPrice: '0x1',
      maxFeePerGas: '0x2',
    })).toThrowError(BuyTransactionValidationError);
  });

  it('rejects account mismatches before send', () => {
    expect(() => assertSimulationMatchesWallet({
      request: baseRequest,
      connectedAddress: '0x2222222222222222222222222222222222222222',
      verifiedWalletAddress: '0x1111111111111111111111111111111111111111',
      activeChainId: 11155111,
    })).toThrowError(BuyTransactionValidationError);
  });

  it('builds a wallet RPC transaction from backend simulation only', () => {
    expect(buildWalletRpcTransaction({
      connectedAddress: '0x1111111111111111111111111111111111111111',
      request: baseRequest,
    })).toEqual({
      from: '0x1111111111111111111111111111111111111111',
      to: '0x1111111111111111111111111111111111111111',
      value: '0x2386f26fc10000',
      data: '0x',
    });
  });
});
