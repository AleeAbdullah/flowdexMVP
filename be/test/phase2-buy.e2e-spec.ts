import * as request from 'supertest';

import { UserRole } from '../src/common/enums/domain.enums';
import {
  TEST_EVM_WALLETS,
  authHeader,
  bootstrapPhase2App,
  createInternalAuthToken,
  resetPhase2TestDatabase,
  seedPhase2Base,
  seedVerifiedWallet,
  shutdownPhase2App,
  truncatePhase2Tables,
  type Phase2Seed,
  type TestContext,
} from './helpers/phase2-harness';

describe('Phase 2 Buy Support (e2e)', () => {
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

  function tokenForUser(id = fixtures.users.user.id, email = fixtures.users.user.email): string {
    return createInternalAuthToken({
      sub: id,
      email,
      role: UserRole.USER,
    });
  }

  it('returns only ETH and USDT_ERC20 in pricing', async () => {
    const response = await request(context.app.getHttpServer()).get('/api/pricing').expect(200);

    expect(response.body.items.map((item: { assetCode: string }) => item.assetCode)).toEqual([
      'ETH',
      'USDT_ERC20',
    ]);
  });

  it('returns only Phase 2 active rails in presale config', async () => {
    const response = await request(context.app.getHttpServer()).get('/api/presale/config').expect(200);

    expect(
      response.body.supportedAssets.map((item: { assetCode: string }) => item.assetCode),
    ).toEqual(['ETH', 'USDT_ERC20']);
  });

  it('creates a purchase intent with a valid wallet and active rail', async () => {
    const wallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);

    const response = await request(context.app.getHttpServer())
      .post('/api/purchase-intents')
      .set(authHeader(tokenForUser()))
      .send({
        walletId: wallet.id,
        assetCode: 'ETH',
        paymentAmount: '1.5',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        intentId: expect.any(String),
        assetCode: 'ETH',
        paymentAmount: '1.5',
        assetUsdPrice: '2000',
        tokenPriceUsd: '0.001',
      }),
    );
  });

  it('rejects unsupported or inactive assets', async () => {
    const wallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);

    await request(context.app.getHttpServer())
      .post('/api/purchase-intents')
      .set(authHeader(tokenForUser()))
      .send({
        walletId: wallet.id,
        assetCode: 'USDT_TRC20',
        paymentAmount: '100',
      })
      .expect(404);
  });

  it('rejects stale asset prices', async () => {
    await truncatePhase2Tables(context.dataSource);
    fixtures = await seedPhase2Base(context.dataSource, {
      staleAssetCodes: ['ETH'],
    });
    const wallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);

    const response = await request(context.app.getHttpServer())
      .post('/api/purchase-intents')
      .set(authHeader(tokenForUser()))
      .send({
        walletId: wallet.id,
        assetCode: 'ETH',
        paymentAmount: '1',
      })
      .expect(400);

    expect(response.body.message).toContain('stale');
  });

  it('rejects below-minimum amounts', async () => {
    const wallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);

    const response = await request(context.app.getHttpServer())
      .post('/api/purchase-intents')
      .set(authHeader(tokenForUser()))
      .send({
        walletId: wallet.id,
        assetCode: 'USDT_ERC20',
        paymentAmount: '10',
      })
      .expect(400);

    expect(response.body.message).toContain('below the minimum');
  });

  it('enforces wallet ownership when creating purchase intents', async () => {
    const otherWallet = await seedVerifiedWallet(
      context.dataSource,
      fixtures.users.other.id,
      TEST_EVM_WALLETS.other,
    );

    await request(context.app.getHttpServer())
      .post('/api/purchase-intents')
      .set(authHeader(tokenForUser()))
      .send({
        walletId: otherWallet.id,
        assetCode: 'ETH',
        paymentAmount: '1',
      })
      .expect(404);
  });
});
