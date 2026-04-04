import { AddressInfo } from 'net';

import {
  TEST_EVM_WALLETS,
  bootstrapPhase2App,
  createInternalAuthToken,
  resetPhase2TestDatabase,
  seedConfirmedIntent,
  seedPhase2Base,
  seedUnmatchedBlockchainTransaction,
  seedVerifiedWallet,
  shutdownPhase2App,
  truncatePhase2Tables,
} from './helpers/phase2-harness';
import { UserRole } from '../src/common/enums/domain.enums';

type SmokeResult = {
  name: string;
  status: number;
  ok: boolean;
};

async function main(): Promise<void> {
  await resetPhase2TestDatabase();
  const context = await bootstrapPhase2App();

  try {
    await truncatePhase2Tables(context.dataSource);
    const fixtures = await seedPhase2Base(context.dataSource);
    const userWallet = await seedVerifiedWallet(
      context.dataSource,
      fixtures.users.user.id,
      TEST_EVM_WALLETS.user,
    );

    await seedConfirmedIntent(context.dataSource, {
      userId: fixtures.users.user.id,
      wallet: userWallet,
      asset: fixtures.assets.eth,
      amount: '1',
      txHash: '0xsmokeconfirmed',
    });

    await seedUnmatchedBlockchainTransaction(context.dataSource, {
      asset: fixtures.assets.eth,
      txHash: '0xsmokeunmatched',
      fromAddress: TEST_EVM_WALLETS.other.address,
      toAddress: '0x4000000000000000000000000000000000000004',
      amount: '1',
      reconciliationReason: 'TREASURY_ADDRESS_MISMATCH',
    });

    const server = await context.app.listen(0);
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const userToken = createInternalAuthToken({
      sub: fixtures.users.user.id,
      email: fixtures.users.user.email,
      role: UserRole.USER,
    });
    const adminToken = createInternalAuthToken({
      sub: fixtures.users.admin.id,
      email: fixtures.users.admin.email,
      role: UserRole.ADMIN,
    });

    const checks: Array<{
      name: string;
      path: string;
      token?: string;
    }> = [
      { name: 'health', path: '/api/health' },
      { name: 'pricing', path: '/api/pricing' },
      { name: 'presale-stats', path: '/api/presale/stats' },
      { name: 'presale-tiers', path: '/api/presale/tiers' },
      { name: 'presale-config', path: '/api/presale/config' },
      { name: 'auth-me', path: '/api/auth/me', token: userToken },
      { name: 'dashboard-summary', path: '/api/dashboard/summary', token: userToken },
      { name: 'wallets', path: '/api/wallets', token: userToken },
      { name: 'transactions', path: '/api/transactions', token: userToken },
      { name: 'admin-stats', path: '/api/admin/stats', token: adminToken },
      { name: 'admin-transactions', path: '/api/admin/transactions', token: adminToken },
      {
        name: 'admin-reconciliation-unmatched',
        path: '/api/admin/reconciliation/unmatched',
        token: adminToken,
      },
    ];

    const results: SmokeResult[] = [];

    for (const check of checks) {
      const response = await fetch(`${baseUrl}${check.path}`, {
        headers: check.token
          ? {
              Authorization: `Bearer ${check.token}`,
            }
          : undefined,
      });

      results.push({
        name: check.name,
        status: response.status,
        ok: response.ok,
      });
    }

    console.log(JSON.stringify({ results }, null, 2));

    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
      process.exitCode = 1;
    }

  } finally {
    await shutdownPhase2App(context);
  }
}

void main();
