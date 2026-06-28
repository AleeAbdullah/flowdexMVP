import { Logger, ServiceUnavailableException } from '@nestjs/common';

import { assertRequiredEnv, env } from '../../../infrastructure/config/env';
import {
  AlchemySolanaProvider,
  createSolanaWalletCheckoutUnavailableException,
} from './alchemy-solana-provider.service';
import {
  SOLANA_WALLET_CHECKOUT_UNAVAILABLE,
  SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE,
  SolanaPaymentExecutionService,
} from './solana-payment-execution.service';

jest.mock('@solana/web3.js', () => ({
  PublicKey: class {
    constructor(private readonly value: string) {}

    toBase58() {
      return this.value;
    }
  },
  SystemProgram: {
    transfer: jest.fn(() => ({ kind: 'transfer' })),
  },
  Transaction: class {
    add = jest.fn();
    recentBlockhash?: string;
    lastValidBlockHeight?: number;
    feePayer?: unknown;

    serialize() {
      return Buffer.from('serialized-solana-transaction');
    }
  },
  TransactionInstruction: class {
    constructor(readonly input: unknown) {}
  },
}));

const validPublicKey = 'FEFZwPZy6r7Ni95AktZ8jd6m9TLUUEVPGnheUXx49GpL';
const validSignature = '5Vf8GxWkQn7PcJzqBvPqhk1uQaJk4y8NPMw9cRXQiEXBSCRrGc1kzvvYB5mgzFiHNx3LqGMotVfVXMsVWpmKnbQd';

type SolanaProviderMock = jest.Mocked<Pick<
  AlchemySolanaProvider,
  'getLatestBlockhash' | 'getSignatureStatus' | 'getParsedTransaction'
>>;

function createProviderMock(): SolanaProviderMock {
  return {
    getLatestBlockhash: jest.fn(),
    getSignatureStatus: jest.fn(),
    getParsedTransaction: jest.fn(),
  };
}

function expectSanitizedSolanaUnavailable(error: unknown) {
  expect(error).toBeInstanceOf(ServiceUnavailableException);

  const response = (error as ServiceUnavailableException).getResponse();
  expect(response).toMatchObject({
    code: SOLANA_WALLET_CHECKOUT_UNAVAILABLE,
    message: SOLANA_WALLET_CHECKOUT_UNAVAILABLE_MESSAGE,
  });
  expect(JSON.stringify(response)).not.toContain('Alchemy');
  expect(JSON.stringify(response)).not.toContain('dashboard');
  expect(JSON.stringify(response)).not.toContain('RPC URL');
  expect(JSON.stringify(response)).not.toContain('alchemy.example.invalid');
  expect(JSON.stringify(response)).not.toContain('app-key');
  expect(JSON.stringify(response)).not.toContain('jsonrpc');
  expect(JSON.stringify(response)).not.toContain('SOLANA_MAINNET is not enabled');
}

describe('SolanaPaymentExecutionService', () => {
  let service: SolanaPaymentExecutionService;
  let solanaProvider: SolanaProviderMock;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    env.alchemySolanaRpcUrl = 'https://alchemy.example.invalid/v2/app-key';
    env.solTreasuryAddress = validPublicKey;
    env.solanaConfirmations = 1;
    env.solanaPreparedActionTtlSeconds = 60;
    solanaProvider = createProviderMock();
    solanaProvider.getLatestBlockhash.mockResolvedValue({
      blockhash: validPublicKey,
      lastValidBlockHeight: 123,
    });
    solanaProvider.getSignatureStatus.mockResolvedValue(null);
    solanaProvider.getParsedTransaction.mockResolvedValue(null);
    service = new SolanaPaymentExecutionService(solanaProvider as unknown as AlchemySolanaProvider);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('sanitizes provider failures while fetching a recent blockhash', async () => {
    solanaProvider.getLatestBlockhash.mockRejectedValue(createSolanaWalletCheckoutUnavailableException());

    try {
      await service.buildSolanaTransferAction({
        payer: validPublicKey,
        recipientAddress: validPublicKey,
        lamports: '1000000000',
        memoOrReference: validPublicKey,
      });
      throw new Error('Expected buildSolanaTransferAction to reject');
    } catch (error) {
      expectSanitizedSolanaUnavailable(error);
    }
    expect(solanaProvider.getLatestBlockhash).toHaveBeenCalledTimes(1);
  });

  it('sanitizes provider failures while verifying a Solana signature', async () => {
    solanaProvider.getSignatureStatus.mockRejectedValue(createSolanaWalletCheckoutUnavailableException());

    try {
      await service.verifySolanaSignatureForIntent({
        signature: validSignature,
        payer: validPublicKey,
        recipientAddress: validPublicKey,
        lamports: '1000000000',
        memoOrReference: validPublicKey,
      });
      throw new Error('Expected verifySolanaSignatureForIntent to reject');
    } catch (error) {
      expectSanitizedSolanaUnavailable(error);
    }
    expect(solanaProvider.getSignatureStatus).toHaveBeenCalledWith(validSignature);
  });

  it('requires Alchemy Solana RPC config at startup', () => {
    const originalEnv = { ...process.env };
    process.env.DATABASE_URL = 'postgres://example.invalid/flowdex';
    process.env.INTERNAL_AUTH_JWT_SECRET = 'secret';
    process.env.ETH_TREASURY_ADDRESS = '0x2222222222222222222222222222222222222222';
    process.env.SOL_TREASURY_ADDRESS = validPublicKey;
    process.env.BTC_PAYMENTS_ENABLED = 'false';
    process.env.ALCHEMY_API_KEY = 'app-key';
    delete process.env.ALCHEMY_SOLANA_RPC_URL;

    try {
      expect(() => assertRequiredEnv()).toThrow('Missing required environment variable: ALCHEMY_SOLANA_RPC_URL');
    } finally {
      process.env = originalEnv;
    }
  });

  it('uses the same sanitized checkout unavailable error when the SOL treasury address is missing', async () => {
    env.solTreasuryAddress = '';

    try {
      await service.buildSolanaTransferAction({
        payer: validPublicKey,
        recipientAddress: validPublicKey,
        lamports: '1000000000',
        memoOrReference: validPublicKey,
      });
      throw new Error('Expected buildSolanaTransferAction to reject');
    } catch (error) {
      expectSanitizedSolanaUnavailable(error);
    }
    expect(solanaProvider.getLatestBlockhash).not.toHaveBeenCalled();
  });
});
