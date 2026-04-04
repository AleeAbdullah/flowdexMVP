import * as request from 'supertest';

import { BlockchainService } from '../src/modules/blockchain/blockchain.service';
import { Chain, UserRole } from '../src/common/enums/domain.enums';
import {
  TEST_EVM_WALLETS,
  authHeader,
  bootstrapPhase2App,
  createInternalAuthToken,
  getBlockchainTransactionRepository,
  getPresaleStateRepository,
  getPurchaseIntentRepository,
  getTokenAllocationRepository,
  resetPhase2TestDatabase,
  seedPhase2Base,
  seedVerifiedWallet,
  shutdownPhase2App,
  truncatePhase2Tables,
  type Phase2Seed,
  type TestContext,
} from './helpers/phase2-harness';

describe('Phase 2 Transactions and Verification (e2e)', () => {
  let context: TestContext;
  let fixtures: Phase2Seed;

  beforeAll(async () => {
    await resetPhase2TestDatabase();
    context = await bootstrapPhase2App();
  });

  afterAll(async () => {
    await shutdownPhase2App(context);
  });

  beforeEach(async () => {
    await truncatePhase2Tables(context.dataSource);
    fixtures = await seedPhase2Base(context.dataSource);
    jest.restoreAllMocks();
  });

  function tokenForUser(user: typeof fixtures.users.user | typeof fixtures.users.other): string {
    return createInternalAuthToken({
      sub: user.id,
      email: user.email,
      role: UserRole.USER,
    });
  }

  async function createIntentForUser(
    user = fixtures.users.user,
    wallet = TEST_EVM_WALLETS.user,
    assetCode = 'ETH',
    amount = '1',
  ): Promise<{ intentId: string; walletId: string }> {
    const savedWallet = await seedVerifiedWallet(context.dataSource, user.id, wallet);

    const response = await request(context.app.getHttpServer())
      .post('/api/purchase-intents')
      .set(authHeader(tokenForUser(user)))
      .send({
        walletId: savedWallet.id,
        assetCode,
        paymentAmount: amount,
      })
      .expect(201);

    return {
      intentId: response.body.intentId,
      walletId: savedWallet.id,
    };
  }

  it('stores a reported tx hash for the caller own intent', async () => {
    const { intentId } = await createIntentForUser();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xabc123' })
      .expect(201);

    const transaction = await request(context.app.getHttpServer())
      .get(`/api/transactions/${intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .expect(200);

    expect(transaction.body.reportedTxHash).toBe('0xabc123');
    expect(transaction.body.txHash).toBe('0xabc123');
  });

  it('rejects transaction reporting for another user intent', async () => {
    const { intentId } = await createIntentForUser(fixtures.users.other, TEST_EVM_WALLETS.other);

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xabc123' })
      .expect(404);
  });

  it('marks an intent failed when the sender wallet mismatches', async () => {
    const { intentId } = await createIntentForUser();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xsenderbad' })
      .expect(201);

    const blockchainService = context.app.get(BlockchainService);
    jest.spyOn(blockchainService as never, 'fetchTransferForIntent' as never).mockResolvedValue({
      transferIndex: 0,
      txHash: '0xsenderbad',
      fromAddress: TEST_EVM_WALLETS.other.address,
      toAddress: fixtures.assets.eth.treasuryAddress,
      amount: '1',
      blockNumber: '100',
      blockTime: new Date(),
      confirmations: 1,
      rawPayload: { source: 'mock' },
    } as never);

    await blockchainService.scanChains();

    const transaction = await request(context.app.getHttpServer())
      .get(`/api/transactions/${intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .expect(200);

    expect(transaction.body.status).toBe('FAILED');
    expect(transaction.body.verificationFailureReason).toBe('SENDER_WALLET_MISMATCH');
  });

  it('marks an intent failed when the treasury address mismatches', async () => {
    const { intentId } = await createIntentForUser();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xtreasurybad' })
      .expect(201);

    const blockchainService = context.app.get(BlockchainService);
    jest.spyOn(blockchainService as never, 'fetchTransferForIntent' as never).mockResolvedValue({
      transferIndex: 0,
      txHash: '0xtreasurybad',
      fromAddress: TEST_EVM_WALLETS.user.address,
      toAddress: '0x4000000000000000000000000000000000000004',
      amount: '1',
      blockNumber: '100',
      blockTime: new Date(),
      confirmations: 1,
      rawPayload: { source: 'mock' },
    } as never);

    await blockchainService.scanChains();

    const transaction = await request(context.app.getHttpServer())
      .get(`/api/transactions/${intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .expect(200);

    expect(transaction.body.status).toBe('FAILED');
    expect(transaction.body.verificationFailureReason).toBe('TREASURY_ADDRESS_MISMATCH');
  });

  it('marks an intent failed when the amount is below the minimum', async () => {
    const { intentId } = await createIntentForUser();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xamountbad' })
      .expect(201);

    const blockchainService = context.app.get(BlockchainService);
    jest.spyOn(blockchainService as never, 'fetchTransferForIntent' as never).mockResolvedValue({
      transferIndex: 0,
      txHash: '0xamountbad',
      fromAddress: TEST_EVM_WALLETS.user.address,
      toAddress: fixtures.assets.eth.treasuryAddress,
      amount: '0.01',
      blockNumber: '100',
      blockTime: new Date(),
      confirmations: 1,
      rawPayload: { source: 'mock' },
    } as never);

    await blockchainService.scanChains();

    const transaction = await request(context.app.getHttpServer())
      .get(`/api/transactions/${intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .expect(200);

    expect(transaction.body.status).toBe('FAILED');
    expect(transaction.body.verificationFailureReason).toBe('AMOUNT_BELOW_MINIMUM');
  });

  it('rejects duplicate tx hash reuse across intents', async () => {
    const first = await createIntentForUser(fixtures.users.user, TEST_EVM_WALLETS.user);
    const second = await createIntentForUser(fixtures.users.other, TEST_EVM_WALLETS.other);

    const blockchainService = context.app.get(BlockchainService);
    const transferSpy = jest.spyOn(blockchainService as never, 'fetchTransferForIntent' as never);
    transferSpy
      .mockResolvedValueOnce({
        transferIndex: 0,
        txHash: '0xduplicate',
        fromAddress: TEST_EVM_WALLETS.user.address,
        toAddress: fixtures.assets.eth.treasuryAddress,
        amount: '1',
        blockNumber: '101',
        blockTime: new Date(),
        confirmations: 1,
        rawPayload: { source: 'mock-first' },
      } as never)
      .mockResolvedValueOnce({
        transferIndex: 0,
        txHash: '0xduplicate',
        fromAddress: TEST_EVM_WALLETS.other.address,
        toAddress: fixtures.assets.eth.treasuryAddress,
        amount: '1',
        blockNumber: '101',
        blockTime: new Date(),
        confirmations: 1,
        rawPayload: { source: 'mock-second' },
      } as never);

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${first.intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xduplicate' })
      .expect(201);
    await blockchainService.scanChains();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${second.intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.other)))
      .send({ txHash: '0xduplicate' })
      .expect(201);
    await blockchainService.scanChains();

    const secondTransaction = await request(context.app.getHttpServer())
      .get(`/api/transactions/${second.intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.other)))
      .expect(200);

    expect(secondTransaction.body.status).toBe('FAILED');
    expect(secondTransaction.body.verificationFailureReason).toBe('TX_ALREADY_MATCHED');
  });

  it('moves a valid transaction from CONFIRMING to CONFIRMED without duplicating finalization', async () => {
    const { intentId } = await createIntentForUser(
      fixtures.users.user,
      TEST_EVM_WALLETS.user,
      'USDT_ERC20',
      '100',
    );

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xgoodtx' })
      .expect(201);

    const blockchainService = context.app.get(BlockchainService);
    const firstBlockTime = new Date();
    jest.spyOn(blockchainService as never, 'fetchTransferForIntent' as never).mockResolvedValue({
      transferIndex: 0,
      txHash: '0xgoodtx',
      fromAddress: TEST_EVM_WALLETS.user.address,
      toAddress: fixtures.assets.usdtErc20.treasuryAddress,
      amount: '100',
      blockNumber: '200',
      blockTime: firstBlockTime,
      confirmations: 1,
      rawPayload: { source: 'mock' },
    } as never);

    await blockchainService.scanChains();

    const confirming = await request(context.app.getHttpServer())
      .get(`/api/transactions/${intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .expect(200);

    expect(confirming.body.status).toBe('CONFIRMING');

    jest.spyOn(blockchainService as never, 'fetchTransferByChainTransaction' as never).mockResolvedValue({
      transferIndex: 0,
      txHash: '0xgoodtx',
      fromAddress: TEST_EVM_WALLETS.user.address,
      toAddress: fixtures.assets.usdtErc20.treasuryAddress,
      amount: '100',
      blockNumber: '200',
      blockTime: firstBlockTime,
      confirmations: 2,
      rawPayload: { source: 'mock' },
    } as never);

    await blockchainService.trackConfirmations();

    const confirmed = await request(context.app.getHttpServer())
      .get(`/api/transactions/${intentId}`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .expect(200);

    expect(confirmed.body.status).toBe('CONFIRMED');
    expect(confirmed.body.tokensAllocated).toBe('100000');

    const allocationRepository = await getTokenAllocationRepository(context.dataSource);
    const blockchainTransactionRepository = await getBlockchainTransactionRepository(context.dataSource);
    const stateRepository = await getPresaleStateRepository(context.dataSource);

    const allocationsBefore = await allocationRepository.count();
    const chainTransactionsBefore = await blockchainTransactionRepository.count();
    const stateBefore = await stateRepository.findOneByOrFail({
      id: '00000000-0000-0000-0000-000000000001',
    });

    await blockchainService.trackConfirmations();

    expect(await allocationRepository.count()).toBe(allocationsBefore);
    expect(await blockchainTransactionRepository.count()).toBe(chainTransactionsBefore);

    const stateAfter = await stateRepository.findOneByOrFail({
      id: '00000000-0000-0000-0000-000000000001',
    });
    expect(stateAfter.totalRaisedUsdReal).toBe(stateBefore.totalRaisedUsdReal);
    expect(stateAfter.totalTokensSoldReal).toBe(stateBefore.totalTokensSoldReal);
  });

  it('allows failed intents to be retried through report-tx', async () => {
    const { intentId } = await createIntentForUser();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xfailthenretry' })
      .expect(201);

    const blockchainService = context.app.get(BlockchainService);
    jest.spyOn(blockchainService as never, 'fetchTransferForIntent' as never).mockResolvedValue({
      transferIndex: 0,
      txHash: '0xfailthenretry',
      fromAddress: TEST_EVM_WALLETS.other.address,
      toAddress: fixtures.assets.eth.treasuryAddress,
      amount: '1',
      blockNumber: '100',
      blockTime: new Date(),
      confirmations: 1,
      rawPayload: { source: 'mock' },
    } as never);

    await blockchainService.scanChains();

    await request(context.app.getHttpServer())
      .post(`/api/purchase-intents/${intentId}/report-tx`)
      .set(authHeader(tokenForUser(fixtures.users.user)))
      .send({ txHash: '0xretried' })
      .expect(201);

    const purchaseIntentRepository = await getPurchaseIntentRepository(context.dataSource);
    const intent = await purchaseIntentRepository.findOneByOrFail({ id: intentId });

    expect(intent.status).toBe('PENDING');
    expect(intent.reportedTxHash).toBe('0xretried');
    expect(intent.failureReason).toBeNull();
  });
});
