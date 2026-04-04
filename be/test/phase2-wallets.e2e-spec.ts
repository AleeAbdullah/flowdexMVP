import { Wallet } from 'ethers';
import * as request from 'supertest';

import { Chain, UserRole } from '../src/common/enums/domain.enums';
import {
  TEST_EVM_WALLETS,
  authHeader,
  bootstrapPhase2App,
  createInternalAuthToken,
  getWalletChallengeRepository,
  resetPhase2TestDatabase,
  seedPhase2Base,
  seedPurchaseIntent,
  seedVerifiedWallet,
  shutdownPhase2App,
  truncatePhase2Tables,
  type Phase2Seed,
  type TestContext,
} from './helpers/phase2-harness';

describe('Phase 2 Wallets (e2e)', () => {
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

  function userToken(): string {
    return createInternalAuthToken({
      sub: fixtures.users.user.id,
      email: fixtures.users.user.email,
      role: UserRole.USER,
    });
  }

  function otherUserToken(): string {
    return createInternalAuthToken({
      sub: fixtures.users.other.id,
      email: fixtures.users.other.email,
      role: UserRole.USER,
    });
  }

  it('creates a challenge for an authenticated user', async () => {
    const response = await request(context.app.getHttpServer())
      .post('/api/wallets/challenge')
      .set(authHeader(userToken()))
      .send({
        chain: Chain.ETH,
        address: TEST_EVM_WALLETS.user.address,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        challengeId: expect.any(String),
        message: expect.stringContaining(TEST_EVM_WALLETS.user.address),
      }),
    );
  });

  it('rejects expired challenges during verification', async () => {
    const challengeResponse = await request(context.app.getHttpServer())
      .post('/api/wallets/challenge')
      .set(authHeader(userToken()))
      .send({
        chain: Chain.ETH,
        address: TEST_EVM_WALLETS.user.address,
      })
      .expect(201);

    const challengeRepository = await getWalletChallengeRepository(context.dataSource);
    await challengeRepository.update(
      { id: challengeResponse.body.challengeId },
      { expiresAt: new Date(Date.now() - 60_000) },
    );

    const signature = await TEST_EVM_WALLETS.user.signMessage(challengeResponse.body.message);

    await request(context.app.getHttpServer())
      .post('/api/wallets/verify')
      .set(authHeader(userToken()))
      .send({
        challengeId: challengeResponse.body.challengeId,
        signature,
      })
      .expect(400);
  });

  it('rejects replay of an already used challenge', async () => {
    const challengeResponse = await request(context.app.getHttpServer())
      .post('/api/wallets/challenge')
      .set(authHeader(userToken()))
      .send({
        chain: Chain.ETH,
        address: TEST_EVM_WALLETS.user.address,
      })
      .expect(201);

    const signature = await TEST_EVM_WALLETS.user.signMessage(challengeResponse.body.message);

    await request(context.app.getHttpServer())
      .post('/api/wallets/verify')
      .set(authHeader(userToken()))
      .send({
        challengeId: challengeResponse.body.challengeId,
        signature,
      })
      .expect(201);

    await request(context.app.getHttpServer())
      .post('/api/wallets/verify')
      .set(authHeader(userToken()))
      .send({
        challengeId: challengeResponse.body.challengeId,
        signature,
      })
      .expect(409);
  });

  it('rejects duplicate wallet verification across users', async () => {
    const firstChallenge = await request(context.app.getHttpServer())
      .post('/api/wallets/challenge')
      .set(authHeader(userToken()))
      .send({
        chain: Chain.ETH,
        address: TEST_EVM_WALLETS.user.address,
      })
      .expect(201);

    await request(context.app.getHttpServer())
      .post('/api/wallets/verify')
      .set(authHeader(userToken()))
      .send({
        challengeId: firstChallenge.body.challengeId,
        signature: await TEST_EVM_WALLETS.user.signMessage(firstChallenge.body.message),
      })
      .expect(201);

    const secondChallenge = await request(context.app.getHttpServer())
      .post('/api/wallets/challenge')
      .set(authHeader(otherUserToken()))
      .send({
        chain: Chain.ETH,
        address: TEST_EVM_WALLETS.user.address,
      })
      .expect(201);

    await request(context.app.getHttpServer())
      .post('/api/wallets/verify')
      .set(authHeader(otherUserToken()))
      .send({
        challengeId: secondChallenge.body.challengeId,
        signature: await TEST_EVM_WALLETS.user.signMessage(secondChallenge.body.message),
      })
      .expect(409);
  });

  it('lists only the caller wallets', async () => {
    await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);
    await seedVerifiedWallet(context.dataSource, fixtures.users.other.id, TEST_EVM_WALLETS.other);

    const response = await request(context.app.getHttpServer())
      .get('/api/wallets')
      .set(authHeader(userToken()))
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].address).toBe(TEST_EVM_WALLETS.user.address);
  });

  it('deletes a wallet when no linked purchase activity exists', async () => {
    const wallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);

    await request(context.app.getHttpServer())
      .delete(`/api/wallets/${wallet.id}`)
      .set(authHeader(userToken()))
      .expect(200);

    const response = await request(context.app.getHttpServer())
      .get('/api/wallets')
      .set(authHeader(userToken()))
      .expect(200);

    expect(response.body.items).toHaveLength(0);
  });

  it('blocks wallet deletion after linked purchase activity exists', async () => {
    const wallet = await seedVerifiedWallet(context.dataSource, fixtures.users.user.id, TEST_EVM_WALLETS.user);

    await seedPurchaseIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      walletId: wallet.id,
      assetId: fixtures.assets.eth.id,
      paymentAddress: fixtures.assets.eth.treasuryAddress,
      expectedAmount: '1',
      quotedAssetPriceUsd: '2000',
      quotedTokenPriceUsd: fixtures.tiers.first.tokenPriceUsd,
      expectedTokensReal: '2000000',
    });

    const response = await request(context.app.getHttpServer())
      .delete(`/api/wallets/${wallet.id}`)
      .set(authHeader(userToken()))
      .expect(409);

    expect(response.body.message).toContain('linked transaction activity');
  });
});
