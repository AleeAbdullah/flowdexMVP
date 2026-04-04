import * as request from 'supertest';

import { IntentStatus, UserRole } from '../src/common/enums/domain.enums';
import {
  TEST_EVM_WALLETS,
  authHeader,
  bootstrapPhase2App,
  createInternalAuthToken,
  getAuditLogCount,
  getRefundRepository,
  resetPhase2TestDatabase,
  seedConfirmedIntent,
  seedPhase2Base,
  seedPurchaseIntent,
  seedUnmatchedBlockchainTransaction,
  seedVerifiedWallet,
  shutdownPhase2App,
  truncatePhase2Tables,
  type Phase2Seed,
  type TestContext,
} from './helpers/phase2-harness';

describe('Phase 2 Admin Backend (e2e)', () => {
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
  });

  function adminToken(): string {
    return createInternalAuthToken({
      sub: fixtures.users.admin.id,
      email: fixtures.users.admin.email,
      role: UserRole.ADMIN,
    });
  }

  function userToken(): string {
    return createInternalAuthToken({
      sub: fixtures.users.user.id,
      email: fixtures.users.user.email,
      role: UserRole.USER,
    });
  }

  it('blocks normal users from admin transaction listing', async () => {
    await request(context.app.getHttpServer())
      .get('/api/admin/transactions')
      .set(authHeader(userToken()))
      .expect(403);
  });

  it('lists and filters admin transactions', async () => {
    const userWallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);
    const otherWallet = await seedVerifiedWallet(
      context.dataSource,
      fixtures.users.other.id,
      TEST_EVM_WALLETS.other,
    );

    await seedConfirmedIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      wallet: userWallet,
      asset: fixtures.assets.eth,
      amount: '1',
      txHash: '0xadminconfirmed',
    });

    await seedPurchaseIntent(context.dataSource, {
      userId: fixtures.users.other.id,
      walletId: otherWallet.id,
      assetId: fixtures.assets.usdtErc20.id,
      paymentAddress: fixtures.assets.usdtErc20.treasuryAddress,
      expectedAmount: '150',
      quotedAssetPriceUsd: '1',
      quotedTokenPriceUsd: fixtures.tiers.first.tokenPriceUsd,
      expectedTokensReal: '150000',
      status: IntentStatus.PENDING,
    });

    const response = await request(context.app.getHttpServer())
      .get('/api/admin/transactions?status=CONFIRMED&assetCode=ETH')
      .set(authHeader(adminToken()))
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        userId: fixtures.users.user.id,
        assetCode: 'ETH',
        status: 'CONFIRMED',
        walletAddress: TEST_EVM_WALLETS.user.address,
      }),
    );
  });

  it('returns unmatched reconciliation entries with machine-readable reasons', async () => {
    await seedUnmatchedBlockchainTransaction(context.dataSource, {
      asset: fixtures.assets.eth,
      txHash: '0xunmatched',
      fromAddress: TEST_EVM_WALLETS.user.address,
      toAddress: '0x4000000000000000000000000000000000000004',
      amount: '1',
      reconciliationReason: 'TREASURY_ADDRESS_MISMATCH',
    });

    const response = await request(context.app.getHttpServer())
      .get('/api/admin/reconciliation/unmatched')
      .set(authHeader(adminToken()))
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        assetCode: 'ETH',
        reconciliationReason: 'TREASURY_ADDRESS_MISMATCH',
      }),
    );
  });

  it('returns top-level admin stats', async () => {
    const userWallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);
    await seedConfirmedIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      wallet: userWallet,
      asset: fixtures.assets.eth,
      amount: '1',
      txHash: '0xstatsconfirmed',
    });

    const response = await request(context.app.getHttpServer())
      .get('/api/admin/stats')
      .set(authHeader(adminToken()))
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        totalConfirmedVolumeReal: '2000',
        currentTier: 1,
      }),
    );
  });

  it('creates a refund only for confirmed intents and records an audit log', async () => {
    const userWallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);
    const { intent } = await seedConfirmedIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      wallet: userWallet,
      asset: fixtures.assets.eth,
      amount: '1',
      txHash: '0xrefundconfirmed',
    });

    const auditLogsBefore = await getAuditLogCount(context.dataSource);

    const createResponse = await request(context.app.getHttpServer())
      .post('/api/admin/refunds')
      .set(authHeader(adminToken()))
      .send({
        purchaseIntentId: intent.id,
        refundAmount: '1',
        destinationAddress: TEST_EVM_WALLETS.user.address,
        reason: 'manual review',
      })
      .expect(201);

    const refundRepository = await getRefundRepository(context.dataSource);
    expect(await refundRepository.count()).toBe(1);
    expect(await getAuditLogCount(context.dataSource)).toBe(auditLogsBefore + 1);

    const duplicateResponse = await request(context.app.getHttpServer())
      .post('/api/admin/refunds')
      .set(authHeader(adminToken()))
      .send({
        purchaseIntentId: intent.id,
        refundAmount: '1',
        destinationAddress: TEST_EVM_WALLETS.user.address,
        reason: 'manual review',
      })
      .expect(201);

    expect(duplicateResponse.body.refundId).toBe(createResponse.body.refundId);
    expect(await refundRepository.count()).toBe(1);

    const listResponse = await request(context.app.getHttpServer())
      .get('/api/admin/refunds')
      .set(authHeader(adminToken()))
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
  });

  it('rejects refund creation for non-confirmed intents', async () => {
    const userWallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);
    const pendingIntent = await seedPurchaseIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      walletId: userWallet.id,
      assetId: fixtures.assets.eth.id,
      paymentAddress: fixtures.assets.eth.treasuryAddress,
      expectedAmount: '1',
      quotedAssetPriceUsd: '2000',
      quotedTokenPriceUsd: fixtures.tiers.first.tokenPriceUsd,
      expectedTokensReal: '2000000',
      status: IntentStatus.PENDING,
    });

    await request(context.app.getHttpServer())
      .post('/api/admin/refunds')
      .set(authHeader(adminToken()))
      .send({
        purchaseIntentId: pendingIntent.id,
        refundAmount: '1',
        destinationAddress: TEST_EVM_WALLETS.user.address,
        reason: 'not allowed yet',
      })
      .expect(400);
  });
});
