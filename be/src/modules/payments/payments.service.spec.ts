import { createHash } from 'node:crypto';

import { PaymentsService } from './payments.service';
import { PaymentCheckoutCapabilityService } from './services/payment-checkout-capability.service';
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

const CHECKOUT_TOKEN = 'wallet-checkout-test-token';

function buildIntent(overrides: Partial<PaymentIntentEntity> = {}): PaymentIntentEntity {
  return {
    id: 'intent-id',
    chain: PaymentChain.BITCOIN,
    asset: PaymentAsset.BTC,
    tokenAmount: '100',
    tokenPriceUsd: '0.01',
    usdAmount: '1',
    quoteCurrency: 'USD',
    quotePriceUsd: '65000',
    quotedAt: new Date(),
    quoteExpiresAt: new Date(Date.now() + 60_000),
    expectedAmountBaseUnits: '10000',
    senderAddress: 'bc1qsenderwalletaddress0000000000000000000000',
    requestIp: null,
    checkoutTokenHash: createHash('sha256').update(CHECKOUT_TOKEN).digest('hex'),
    receiverAddress: 'bc1qrecipientaddress0000000000000000000000',
    solanaReference: null,
    ethCreatedBlockNumber: null,
    tronCreatedBlockNumber: null,
    btcDerivationIndex: 1,
    btcDerivationPath: "m/84'/0'/0'/0/1",
    status: PaymentIntentStatus.WAITING,
    expiresAt: new Date(Date.now() + 60_000),
    lastCheckedAt: null,
    lastCheckResult: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildAction(intent: PaymentIntentEntity, overrides: Partial<PaymentWalletActionEntity> = {}): PaymentWalletActionEntity {
  return {
    id: 'wallet-action-id',
    paymentIntentId: intent.id,
    paymentIntent: intent,
    chain: intent.chain,
    actionKind: PaymentWalletActionKind.BITCOIN_TRANSFER,
    senderAddress: intent.senderAddress!,
    walletChainId: 'mainnet',
    status: PaymentWalletActionStatus.PREPARED,
    requestJson: {},
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
    txId: null,
    txIdKind: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildService(input: {
  intent?: PaymentIntentEntity;
  action?: PaymentWalletActionEntity | null;
  payment?: PaymentEntity | null;
  executor?: { prepare: jest.Mock; assertTxId: jest.Mock };
}) {
  const intent = input.intent ?? buildIntent();
  const action = input.action ?? buildAction(intent);
  const payment = input.payment ?? null;
  const paymentIntentsRepository = {
    findOne: jest.fn().mockResolvedValue(intent),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn(async (value: unknown) => value),
  };
  const paymentsRepository = {
    findOne: jest.fn().mockResolvedValue(payment),
  };
  const paymentWalletActionsRepository = {
    findOne: jest.fn().mockResolvedValue(action),
  };
  const manager = {
    findOne: jest.fn(async (entity: unknown, options: { where: Record<string, unknown> }) => {
      if (entity === PaymentIntentEntity) return intent;
      if (entity === PaymentWalletActionEntity) {
        if (options.where.id) return action;
        return null;
      }
      if (entity === PaymentEntity) return payment;
      return null;
    }),
    create: jest.fn((_entity: unknown, value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
  };
  const dataSource = {
    transaction: jest.fn(async (callback: (manager: unknown) => unknown) => callback(manager)),
  };
  const executor = input.executor ?? {
    prepare: jest.fn(),
    assertTxId: jest.fn(),
  };
  const registry = { get: jest.fn(() => executor) };
  const stateService = { assertIntentTransition: jest.fn() };
  const service = new PaymentsService(
    paymentIntentsRepository as never,
    paymentsRepository as never,
    paymentWalletActionsRepository as never,
    dataSource as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    stateService as never,
    registry as never,
    new PaymentCheckoutCapabilityService(),
  );

  return { service, intent, action, paymentIntentsRepository, paymentsRepository, manager, executor, stateService };
}

describe('PaymentsService wallet checkout', () => {
  it('returns the stored payment status without provider scans on the public status endpoint', async () => {
    const { service, intent, paymentsRepository } = buildService({});

    const result = await service.getIntentStatus(intent.id);

    expect(paymentsRepository.findOne).toHaveBeenCalledWith({ where: { intentId: intent.id } });
    expect(result.intent.id).toBe(intent.id);
    expect(result.intent.status).toBe(PaymentIntentStatus.WAITING);
  });

  it('prepares a wallet action using the intent-scoped capability token', async () => {
    const executor = { prepare: jest.fn().mockResolvedValue({ preparedActionId: 'wallet-action-id' }), assertTxId: jest.fn() };
    const { service, intent } = buildService({ executor });

    await service.prepareWalletAction(intent.id, CHECKOUT_TOKEN, {
      chain: PaymentChain.BITCOIN,
      senderAddress: intent.senderAddress!,
      walletChainId: 'mainnet',
    });

    expect(executor.prepare).toHaveBeenCalledWith(expect.objectContaining({
      intent,
      senderAddress: intent.senderAddress,
    }));
  });

  it('records a broadcast transaction as confirming without waiting for an indexer response', async () => {
    const { service, intent, action, manager, executor, stateService } = buildService({});
    const txId = 'a'.repeat(64);

    const result = await service.submitWalletTxResult(intent.id, CHECKOUT_TOKEN, {
      chain: PaymentChain.BITCOIN,
      preparedActionId: action.id,
      txIdKind: PaymentWalletTxIdKind.BTC_TX_HASH,
      txId,
    });

    expect(executor.assertTxId).toHaveBeenCalledWith(PaymentWalletTxIdKind.BTC_TX_HASH, txId);
    expect(stateService.assertIntentTransition).toHaveBeenCalledWith(PaymentIntentStatus.WAITING, PaymentIntentStatus.CONFIRMING);
    expect(manager.create).toHaveBeenCalledWith(PaymentEntity, expect.objectContaining({
      intentId: intent.id,
      txHash: txId,
      status: PaymentStatus.CONFIRMING,
      confirmations: 0,
    }));
    expect(result.intent.status).toBe(PaymentIntentStatus.CONFIRMING);
    expect(result.payment?.txHash).toBe(txId);
  });

  it('does not accept an invalid or missing checkout capability token', async () => {
    const { service, intent } = buildService({});

    await expect(service.prepareWalletAction(intent.id, 'wrong-token', {
      chain: PaymentChain.BITCOIN,
      senderAddress: intent.senderAddress!,
      walletChainId: 'mainnet',
    })).rejects.toThrow('Invalid payment checkout token');
  });

  it('advertises Bitcoin/Xverse and TRON/TronLink checkout capability records', () => {
    const { service } = buildService({});

    const capabilities = service.getCheckoutCapabilities();

    expect(capabilities.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ chain: PaymentChain.BITCOIN, asset: PaymentAsset.BTC, walletProvider: 'xverse' }),
      expect.objectContaining({ chain: PaymentChain.TRON, asset: PaymentAsset.USDT_TRC20, walletProvider: 'tronlink' }),
    ]));
  });
});
