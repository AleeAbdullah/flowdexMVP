import { PaymentsService } from './payments.service';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentWalletActionEntity } from './entities/payment-wallet-action.entity';
import {
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
  PaymentStatus,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  PaymentWalletTxIdKind,
} from './payments.types';

function buildServiceWithQueryRows(rows: unknown[]) {
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  const paymentsRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  };
  const service = new PaymentsService(
    {} as never,
    paymentsRepository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, paymentsRepository, queryBuilder };
}

function buildServiceWithPortfolioRows(input: {
  intents: unknown[];
  payments: unknown[];
}) {
  const paymentIntentsRepository = {
    find: jest.fn().mockResolvedValue(input.intents),
  };
  const paymentsRepository = {
    find: jest.fn().mockResolvedValue(input.payments),
  };
  const service = new PaymentsService(
    paymentIntentsRepository as never,
    paymentsRepository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, paymentIntentsRepository, paymentsRepository };
}

function buildServiceForWalletActions(input: {
  intent?: unknown;
  action?: unknown;
  duplicateAction?: unknown;
  duplicatePayment?: unknown;
  existingPayment?: unknown;
}) {
  const paymentIntentsRepository = {
    findOne: jest.fn().mockResolvedValue(input.intent ?? null),
  };
  const paymentsRepository = {};
  const paymentWalletActionsRepository = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: unknown) => ({ id: 'prepared-action-id', ...(value as object) })),
  };
  let walletActionFindCount = 0;
  let paymentFindCount = 0;
  const manager = {
    findOne: jest.fn(async (entity: unknown) => {
      if (entity === PaymentIntentEntity) {
        return input.intent ?? null;
      }
      if (entity === PaymentWalletActionEntity) {
        walletActionFindCount += 1;
        if (walletActionFindCount === 1) {
          return input.action ?? null;
        }
        return input.duplicateAction ?? null;
      }
      if (entity === PaymentEntity) {
        paymentFindCount += 1;
        if (paymentFindCount === 1) {
          return input.duplicatePayment ?? null;
        }
        return input.existingPayment ?? null;
      }
      return null;
    }),
    create: jest.fn((_entity: unknown, value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
  };
  const dataSource = {
    transaction: jest.fn(async (callback: (managerArg: unknown) => unknown) => callback(manager)),
  };
  const evmPaymentExecutionService = {
    buildNativeEthPaymentRequest: jest.fn(() => ({
      to: '0x2222222222222222222222222222222222222222',
      chainId: 1,
      value: '0x2386f26fc10000',
      data: '0x',
    })),
  };
  const stateService = {
    assertIntentTransition: jest.fn(),
    toIntentStatus: jest.fn((status: PaymentStatus) => {
      switch (status) {
        case PaymentStatus.CONFIRMED:
          return PaymentIntentStatus.CONFIRMED;
        case PaymentStatus.FAILED:
          return PaymentIntentStatus.FAILED;
        default:
          return PaymentIntentStatus.CONFIRMING;
      }
    }),
  };
  const solanaPaymentExecutionService = {
    normalizePublicKey: jest.fn((value: string) => value),
    buildConfig: jest.fn(() => ({
      cluster: 'mainnet-beta',
      rpcUrl: 'https://example.invalid',
      recipientAddress: 'FEFZwPZy6r7Ni95AktZ8jd6m9TLUUEVPGnheUXx49GpL',
      minConfirmations: 1,
      preparedActionTtlSeconds: 60,
    })),
    buildSolanaTransferAction: jest.fn(async () => ({
      cluster: 'mainnet-beta',
      payer: 'solana-sender',
      recipientAddress: 'FEFZwPZy6r7Ni95AktZ8jd6m9TLUUEVPGnheUXx49GpL',
      lamports: '1000000000',
      transactionBase64: 'base64-tx',
      transactionEncoding: 'base64',
      blockhash: 'blockhash',
      lastValidBlockHeight: 123,
      memoOrReference: 'reference',
    })),
    verifySolanaSignatureForIntent: jest.fn(async () => ({ status: 'not_found' })),
  };
  const service = new PaymentsService(
    paymentIntentsRepository as never,
    paymentsRepository as never,
    paymentWalletActionsRepository as never,
    dataSource as never,
    {} as never,
    {} as never,
    {} as never,
    evmPaymentExecutionService as never,
    solanaPaymentExecutionService as never,
    stateService as never,
  );

  return {
    service,
    paymentIntentsRepository,
    paymentWalletActionsRepository,
    dataSource,
    manager,
    evmPaymentExecutionService,
    solanaPaymentExecutionService,
    stateService,
  };
}

const walletAuth = {
  sub: 'wallet-session',
  authType: 'wallet' as const,
  sessionId: 'session-id',
  walletAddressNormalized: '0x1111111111111111111111111111111111111111',
  walletAddressChecksum: '0x1111111111111111111111111111111111111111',
  lastVerifiedChainId: 1,
};

const solanaWalletAuth = {
  sub: 'solana-wallet-session',
  authType: 'wallet' as const,
  sessionId: 'solana-session-id',
  walletChain: 'SOLANA' as const,
  walletAddressNormalized: '4Nd1mVtA6Htd7qgrJQYzT8YhP76jYwgyhdjgq2scLqEL',
  walletAddressChecksum: '4Nd1mVtA6Htd7qgrJQYzT8YhP76jYwgyhdjgq2scLqEL',
  lastVerifiedChainId: null,
};

function buildEthIntent(overrides: Partial<PaymentIntentEntity> = {}): PaymentIntentEntity {
  return {
    id: 'intent-id',
    chain: PaymentChain.ETHEREUM,
    asset: PaymentAsset.ETH,
    tokenAmount: '100.000000000000000000',
    tokenPriceUsd: '0.010000000000000000',
    usdAmount: '1.000000000000000000',
    quoteCurrency: 'USD',
    quotePriceUsd: '2850.000000000000000000',
    quotedAt: new Date('2026-06-28T00:00:00.000Z'),
    quoteExpiresAt: new Date('2026-06-28T00:05:00.000Z'),
    expectedAmountBaseUnits: '10000000000000000',
    senderAddress: walletAuth.walletAddressNormalized,
    requestIp: null,
    receiverAddress: '0x2222222222222222222222222222222222222222',
    solanaReference: null,
    ethCreatedBlockNumber: '0x1',
    btcDerivationIndex: null,
    btcDerivationPath: null,
    status: PaymentIntentStatus.WAITING,
    expiresAt: new Date(Date.now() + 60_000),
    lastCheckedAt: null,
    lastCheckResult: null,
    createdAt: new Date('2026-06-28T00:00:00.000Z'),
    updatedAt: new Date('2026-06-28T00:00:00.000Z'),
    ...overrides,
  };
}

function buildSolanaIntent(overrides: Partial<PaymentIntentEntity> = {}): PaymentIntentEntity {
  return {
    ...buildEthIntent(),
    id: 'solana-intent-id',
    chain: PaymentChain.SOLANA,
    asset: PaymentAsset.SOL,
    expectedAmountBaseUnits: '1000000000',
    senderAddress: solanaWalletAuth.walletAddressNormalized,
    receiverAddress: 'FEFZwPZy6r7Ni95AktZ8jd6m9TLUUEVPGnheUXx49GpL',
    solanaReference: '11111111111111111111111111111111',
    ethCreatedBlockNumber: null,
    ...overrides,
  };
}

describe('PaymentsService', () => {
  describe('listPublicLeaders', () => {
    it('returns confirmed payment leaders ranked by total USD', async () => {
      const latestPaymentAt = new Date('2026-06-26T10:00:00.000Z');
      const { service, paymentsRepository, queryBuilder } = buildServiceWithQueryRows([
        {
          walletAddress: '0xleader',
          totalUsd: '48500.000000000000000000',
          paymentCount: '3',
          latestPaymentAt,
        },
        {
          walletAddress: 'SoLanaBuyer111111111111111111111111111',
          totalUsd: '1200.5',
          paymentCount: '1',
          latestPaymentAt: '2026-06-25T09:00:00.000Z',
        },
      ]);

      const result = await service.listPublicLeaders(10);

      expect(paymentsRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('payment.intent', 'intent');
      expect(queryBuilder.where).toHaveBeenCalledWith('payment.status = :status', {
        status: PaymentStatus.CONFIRMED,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('payment.sender_address IS NOT NULL');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('payment.sender_address');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('SUM(intent.usd_amount)', 'DESC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('MAX(payment.created_at)', 'DESC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items: [
          {
            rank: 1,
            walletAddress: '0xleader',
            totalUsd: '48500',
            paymentCount: 3,
            latestPaymentAt,
          },
          {
            rank: 2,
            walletAddress: 'SoLanaBuyer111111111111111111111111111',
            totalUsd: '1200.5',
            paymentCount: 1,
            latestPaymentAt: new Date('2026-06-25T09:00:00.000Z'),
          },
        ],
      });
    });

    it('caps the public leaderboard limit', async () => {
      const { service, queryBuilder } = buildServiceWithQueryRows([]);

      await service.listPublicLeaders(200);

      expect(queryBuilder.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getPublicPortfolio', () => {
    it('aggregates confirmed portfolio totals and groups non-confirmed intent states', async () => {
      const walletAddress = '0x1111111111111111111111111111111111111111';
      const firstCreatedAt = new Date('2026-06-24T08:00:00.000Z');
      const latestCreatedAt = new Date('2026-06-27T09:00:00.000Z');
      const { service, paymentIntentsRepository, paymentsRepository } = buildServiceWithPortfolioRows({
        intents: [
          {
            id: 'intent-confirmed',
            chain: PaymentChain.ETHEREUM,
            asset: PaymentAsset.ETH,
            tokenAmount: '1000.000000000000000000',
            usdAmount: '10.000000000000000000',
            expectedAmountBaseUnits: '3500000000000000',
            senderAddress: walletAddress,
            receiverAddress: '0xtreasury',
            status: PaymentIntentStatus.CONFIRMED,
            createdAt: firstCreatedAt,
            expiresAt: new Date('2026-06-24T08:30:00.000Z'),
          },
          {
            id: 'intent-waiting',
            chain: PaymentChain.SOLANA,
            asset: PaymentAsset.SOL,
            tokenAmount: '200.000000000000000000',
            usdAmount: '2.000000000000000000',
            expectedAmountBaseUnits: '10000000',
            senderAddress: walletAddress,
            receiverAddress: 'SolTreasury11111111111111111111111111111',
            status: PaymentIntentStatus.WAITING,
            createdAt: new Date('2026-06-25T08:00:00.000Z'),
            expiresAt: new Date('2026-06-25T08:30:00.000Z'),
          },
          {
            id: 'intent-review',
            chain: PaymentChain.ETHEREUM,
            asset: PaymentAsset.ETH,
            tokenAmount: '50.000000000000000000',
            usdAmount: '0.500000000000000000',
            expectedAmountBaseUnits: '175000000000000',
            senderAddress: walletAddress,
            receiverAddress: '0xtreasury',
            status: PaymentIntentStatus.OVERPAID,
            createdAt: latestCreatedAt,
            expiresAt: new Date('2026-06-27T09:30:00.000Z'),
          },
          {
            id: 'intent-expired',
            chain: PaymentChain.ETHEREUM,
            asset: PaymentAsset.ETH,
            tokenAmount: '30.000000000000000000',
            usdAmount: '0.300000000000000000',
            expectedAmountBaseUnits: '105000000000000',
            senderAddress: walletAddress,
            receiverAddress: '0xtreasury',
            status: PaymentIntentStatus.EXPIRED,
            createdAt: new Date('2026-06-26T08:00:00.000Z'),
            expiresAt: new Date('2026-06-26T08:30:00.000Z'),
          },
        ],
        payments: [
          {
            intentId: 'intent-confirmed',
            amountBaseUnits: '3500000000000000',
            txHash: '0xtx',
            status: PaymentStatus.CONFIRMED,
            confirmations: 12,
            confirmedAt: new Date('2026-06-24T08:10:00.000Z'),
          },
        ],
      });

      const result = await service.getPublicPortfolio(walletAddress);

      expect(paymentIntentsRepository.find).toHaveBeenCalledWith({
        where: [
          { senderAddress: walletAddress },
        ],
        order: { createdAt: 'DESC' },
      });
      expect(paymentsRepository.find).toHaveBeenCalled();
      expect(result.summary).toEqual({
        totalInvestedUsd: '10',
        confirmedTokenAmount: '1000',
        pendingTokenAmount: '200',
        reviewTokenAmount: '50',
        totalTransactions: 4,
        confirmedTransactions: 1,
        pendingTransactions: 1,
        reviewTransactions: 1,
        failedTransactions: 1,
        averageEntryPriceUsd: '0.01',
        firstPaymentAt: firstCreatedAt,
        latestPaymentAt: latestCreatedAt,
      });
      expect(result.breakdowns.byAsset).toEqual([
        { key: PaymentAsset.ETH, totalUsd: '10', tokenAmount: '1000', transactionCount: 1 },
      ]);
      expect(result.breakdowns.byChain).toEqual([
        { key: PaymentChain.ETHEREUM, totalUsd: '10', tokenAmount: '1000', transactionCount: 1 },
      ]);
      expect(result.breakdowns.byStatus).toEqual([
        { key: PaymentIntentStatus.CONFIRMED, totalUsd: '10', tokenAmount: '1000', transactionCount: 1 },
        { key: PaymentIntentStatus.WAITING, totalUsd: '2', tokenAmount: '200', transactionCount: 1 },
        { key: PaymentIntentStatus.OVERPAID, totalUsd: '0.5', tokenAmount: '50', transactionCount: 1 },
        { key: PaymentIntentStatus.EXPIRED, totalUsd: '0.3', tokenAmount: '30', transactionCount: 1 },
      ]);
      expect(result.transactions).toHaveLength(4);
      expect(result.transactions[0]).toMatchObject({
        intentId: 'intent-confirmed',
        paidAmountBaseUnits: '3500000000000000',
        txHash: '0xtx',
        paymentStatus: PaymentStatus.CONFIRMED,
        confirmations: 12,
      });
      expect(result.transactions[1]).toMatchObject({
        intentId: 'intent-waiting',
        paidAmountBaseUnits: null,
        txHash: null,
        paymentStatus: null,
        confirmations: 0,
      });
    });

    it('returns an empty portfolio when the wallet has no intents', async () => {
      const { service, paymentsRepository } = buildServiceWithPortfolioRows({
        intents: [],
        payments: [],
      });

      const result = await service.getPublicPortfolio('SolanaBuyer111111111111111111111111111111');

      expect(paymentsRepository.find).not.toHaveBeenCalled();
      expect(result.summary).toMatchObject({
        totalInvestedUsd: '0',
        confirmedTokenAmount: '0',
        totalTransactions: 0,
        averageEntryPriceUsd: '0',
        firstPaymentAt: null,
        latestPaymentAt: null,
      });
      expect(result.transactions).toEqual([]);
    });
  });

  describe('wallet payment actions', () => {
    it('creates a durable prepared wallet action for an authenticated ETH wallet intent', async () => {
      const intent = buildEthIntent();
      const { service, paymentWalletActionsRepository, evmPaymentExecutionService } = buildServiceForWalletActions({ intent });

      const result = await service.prepareWalletAction(walletAuth, intent.id, {
        chain: PaymentChain.ETHEREUM,
        senderAddress: walletAuth.walletAddressChecksum,
        walletChainId: 1,
      });

      expect(evmPaymentExecutionService.buildNativeEthPaymentRequest).toHaveBeenCalledWith({
        receiverAddress: intent.receiverAddress,
        amountBaseUnits: intent.expectedAmountBaseUnits,
        chainId: 1,
      });
      expect(paymentWalletActionsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        paymentIntentId: intent.id,
        chain: PaymentChain.ETHEREUM,
        actionKind: PaymentWalletActionKind.EVM_TRANSACTION,
        senderAddress: walletAuth.walletAddressNormalized,
        status: PaymentWalletActionStatus.PREPARED,
      }));
      expect(result).toMatchObject({
        kind: 'evm_transaction',
        paymentIntentId: intent.id,
        preparedActionId: 'prepared-action-id',
        chain: PaymentChain.ETHEREUM,
        chainId: 1,
      });
    });

    it('rejects wallet action preparation when the sender does not match the wallet session', async () => {
      const intent = buildEthIntent();
      const { service } = buildServiceForWalletActions({ intent });

      await expect(service.prepareWalletAction(walletAuth, intent.id, {
        chain: PaymentChain.ETHEREUM,
        senderAddress: '0x3333333333333333333333333333333333333333',
        walletChainId: 1,
      })).rejects.toThrow('senderAddress does not match wallet session');
    });

    it('attaches an EVM tx hash to the payment intent lifecycle as confirming', async () => {
      const intent = buildEthIntent();
      const action = {
        id: 'prepared-action-id',
        paymentIntentId: intent.id,
        chain: PaymentChain.ETHEREUM,
        actionKind: PaymentWalletActionKind.EVM_TRANSACTION,
        senderAddress: walletAuth.walletAddressNormalized,
        walletChainId: '1',
        status: PaymentWalletActionStatus.PREPARED,
        requestJson: {},
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        txId: null,
        txIdKind: null,
      };
      const { service, manager, stateService } = buildServiceForWalletActions({ intent, action });
      const txId = `0x${'a'.repeat(64)}` as `0x${string}`;

      const result = await service.submitWalletTxResult(walletAuth, intent.id, {
        chain: PaymentChain.ETHEREUM,
        preparedActionId: action.id,
        txIdKind: PaymentWalletTxIdKind.EVM_TX_HASH,
        txId,
      });

      expect(stateService.assertIntentTransition).toHaveBeenCalledWith(PaymentIntentStatus.WAITING, PaymentIntentStatus.CONFIRMING);
      expect(manager.save).toHaveBeenCalledWith(expect.objectContaining({
        status: PaymentWalletActionStatus.USED,
        txId,
        txIdKind: PaymentWalletTxIdKind.EVM_TX_HASH,
      }));
      expect(manager.create).toHaveBeenCalledWith(PaymentEntity, expect.objectContaining({
        intentId: intent.id,
        chain: PaymentChain.ETHEREUM,
        asset: PaymentAsset.ETH,
        amountBaseUnits: intent.expectedAmountBaseUnits,
        txHash: txId,
        status: PaymentStatus.CONFIRMING,
        confirmations: 0,
      }));
      expect(result).toMatchObject({
        intent: {
          id: intent.id,
          status: PaymentIntentStatus.CONFIRMING,
        },
        payment: {
          intentId: intent.id,
          status: PaymentStatus.CONFIRMING,
          txHash: txId,
        },
      });
    });

    it('rejects tx-result when the tx hash belongs to another payment intent', async () => {
      const intent = buildEthIntent();
      const action = {
        id: 'prepared-action-id',
        paymentIntentId: intent.id,
        chain: PaymentChain.ETHEREUM,
        actionKind: PaymentWalletActionKind.EVM_TRANSACTION,
        senderAddress: walletAuth.walletAddressNormalized,
        status: PaymentWalletActionStatus.PREPARED,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const duplicateAction = {
        id: 'other-action-id',
        paymentIntentId: 'other-intent-id',
      };
      const { service } = buildServiceForWalletActions({ intent, action, duplicateAction });
      const txId = `0x${'b'.repeat(64)}` as `0x${string}`;

      await expect(service.submitWalletTxResult(walletAuth, intent.id, {
        chain: PaymentChain.ETHEREUM,
        preparedActionId: action.id,
        txIdKind: PaymentWalletTxIdKind.EVM_TX_HASH,
        txId,
      })).rejects.toThrow('Transaction hash is already attached to another payment intent');
    });

    it('rejects tx-result when an existing payment already has the tx hash', async () => {
      const intent = buildEthIntent();
      const action = {
        id: 'prepared-action-id',
        paymentIntentId: intent.id,
        chain: PaymentChain.ETHEREUM,
        actionKind: PaymentWalletActionKind.EVM_TRANSACTION,
        senderAddress: walletAuth.walletAddressNormalized,
        status: PaymentWalletActionStatus.PREPARED,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const duplicatePayment = {
        intentId: 'other-intent-id',
        txHash: `0x${'c'.repeat(64)}`,
      };
      const { service } = buildServiceForWalletActions({ intent, action, duplicatePayment });
      const txId = duplicatePayment.txHash as `0x${string}`;

      await expect(service.submitWalletTxResult(walletAuth, intent.id, {
        chain: PaymentChain.ETHEREUM,
        preparedActionId: action.id,
        txIdKind: PaymentWalletTxIdKind.EVM_TX_HASH,
        txId,
      })).rejects.toThrow('Transaction hash is already attached to another payment intent');
    });

    it('creates a SOL prepared wallet action with serialized transaction metadata', async () => {
      const intent = buildSolanaIntent();
      const { service, paymentWalletActionsRepository, solanaPaymentExecutionService } = buildServiceForWalletActions({ intent });

      const result = await service.prepareWalletAction(solanaWalletAuth, intent.id, {
        chain: PaymentChain.SOLANA,
        senderAddress: solanaWalletAuth.walletAddressNormalized,
        walletChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
      });

      expect(solanaPaymentExecutionService.buildSolanaTransferAction).toHaveBeenCalledWith(expect.objectContaining({
        payer: solanaWalletAuth.walletAddressNormalized,
        lamports: intent.expectedAmountBaseUnits,
        memoOrReference: intent.solanaReference,
      }));
      expect(paymentWalletActionsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        chain: PaymentChain.SOLANA,
        actionKind: PaymentWalletActionKind.SOLANA_TRANSACTION,
        senderAddress: solanaWalletAuth.walletAddressNormalized,
        walletChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        requestJson: expect.objectContaining({
          transactionBase64: 'base64-tx',
          lastValidBlockHeight: 123,
        }),
      }));
      expect(result).toMatchObject({
        kind: PaymentWalletActionKind.SOLANA_TRANSACTION,
        paymentIntentId: intent.id,
        chain: PaymentChain.SOLANA,
        transaction: 'base64-tx',
        transactionEncoding: 'base64',
        lastValidBlockHeight: 123,
      });
    });

    it('attaches a SOL signature as confirming after tx-result submission', async () => {
      const intent = buildSolanaIntent();
      const action = {
        id: 'prepared-solana-action-id',
        paymentIntentId: intent.id,
        chain: PaymentChain.SOLANA,
        actionKind: PaymentWalletActionKind.SOLANA_TRANSACTION,
        senderAddress: solanaWalletAuth.walletAddressNormalized,
        walletChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        status: PaymentWalletActionStatus.PREPARED,
        requestJson: {
          payer: solanaWalletAuth.walletAddressNormalized,
          recipientAddress: intent.receiverAddress,
          lamports: intent.expectedAmountBaseUnits,
          memoOrReference: intent.solanaReference,
        },
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        txId: null,
        txIdKind: null,
      };
      const { service, manager, stateService, solanaPaymentExecutionService } = buildServiceForWalletActions({ intent, action });
      const txId = '5Vf8GxWkQn7PcJzqBvPqhk1uQaJk4y8NPMw9cRXQiEXBSCRrGc1kzvvYB5mgzFiHNx3LqGMotVfVXMsVWpmKnbQd';

      const result = await service.submitWalletTxResult(solanaWalletAuth, intent.id, {
        chain: PaymentChain.SOLANA,
        preparedActionId: action.id,
        txIdKind: PaymentWalletTxIdKind.SOLANA_SIGNATURE,
        txId,
      });

      expect(solanaPaymentExecutionService.verifySolanaSignatureForIntent).toHaveBeenCalledWith({
        signature: txId,
        payer: solanaWalletAuth.walletAddressNormalized,
        recipientAddress: intent.receiverAddress,
        lamports: intent.expectedAmountBaseUnits,
        memoOrReference: intent.solanaReference,
      });
      expect(stateService.assertIntentTransition).toHaveBeenCalledWith(PaymentIntentStatus.WAITING, PaymentIntentStatus.CONFIRMING);
      expect(manager.save).toHaveBeenCalledWith(expect.objectContaining({
        status: PaymentWalletActionStatus.USED,
        txId,
        txIdKind: PaymentWalletTxIdKind.SOLANA_SIGNATURE,
      }));
      expect(manager.create).toHaveBeenCalledWith(PaymentEntity, expect.objectContaining({
        chain: PaymentChain.SOLANA,
        asset: PaymentAsset.SOL,
        txHash: txId,
        status: PaymentStatus.CONFIRMING,
      }));
      expect(result.intent.status).toBe(PaymentIntentStatus.CONFIRMING);
    });
  });
});
