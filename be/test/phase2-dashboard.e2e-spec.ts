import * as request from 'supertest';

import { IntentStatus, UserRole } from '../src/common/enums/domain.enums';
import {
  TEST_EVM_WALLETS,
  authHeader,
  bootstrapPhase2App,
  createInternalAuthToken,
  resetPhase2TestDatabase,
  seedConfirmedIntent,
  seedPhase2Base,
  seedPurchaseIntent,
  seedVerifiedWallet,
  shutdownPhase2App,
  truncatePhase2Tables,
  type Phase2Seed,
  type TestContext,
} from './helpers/phase2-harness';

describe('Phase 2 Dashboard (e2e)', () => {
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

  it('returns a frontend-ready dashboard summary scoped to the authenticated user', async () => {
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
      txHash: '0xdashboardconfirmed',
    });

    await seedPurchaseIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      walletId: userWallet.id,
      assetId: fixtures.assets.usdtErc20.id,
      paymentAddress: fixtures.assets.usdtErc20.treasuryAddress,
      expectedAmount: '100',
      quotedAssetPriceUsd: '1',
      quotedTokenPriceUsd: fixtures.tiers.first.tokenPriceUsd,
      expectedTokensReal: '100000',
      status: IntentStatus.PENDING,
    });

    await seedConfirmedIntent(context.dataSource, {
      userId: fixtures.users.other.id,
      wallet: otherWallet,
      asset: fixtures.assets.eth,
      amount: '3',
      txHash: '0xotherconfirmed',
    });

    const response = await request(context.app.getHttpServer())
      .get('/api/dashboard/summary')
      .set(authHeader(userToken()))
      .expect(200);

    expect(response.body.profile).toEqual({
      userId: fixtures.users.user.id,
      email: fixtures.users.user.email,
      role: 'USER',
      status: 'ACTIVE',
    });
    expect(response.body.walletSummary.linkedWalletCount).toBe(1);
    expect(response.body.walletSummary.primaryWallet.address).toBe(TEST_EVM_WALLETS.user.address);
    expect(response.body.activePurchaseIntentCount).toBe(1);
    expect(response.body.confirmedTransactionCount).toBe(1);
    expect(response.body.totalContributedAmount).toBe('1');
    expect(response.body.totalAllocatedTokens).toBe('2000000');
    expect(response.body.recentTransactions).toHaveLength(2);
    expect(
      response.body.recentTransactions.every(
        (item: { userId: string }) => item.userId === fixtures.users.user.id,
      ),
    ).toBe(true);
  });
});
