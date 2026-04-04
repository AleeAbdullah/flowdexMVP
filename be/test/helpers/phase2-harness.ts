import 'reflect-metadata';

import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { config as loadEnv } from 'dotenv';
import { Wallet } from 'ethers';
import { join } from 'path';
import { DataSource, Repository } from 'typeorm';

import { AdminAuditLogEntity } from '../../src/modules/admin/entities/admin-audit-log.entity';
import { RefundEntity } from '../../src/modules/admin/entities/refund.entity';
import { BlockchainTransactionEntity } from '../../src/modules/blockchain/entities/blockchain-transaction.entity';
import {
  BlockchainTxStatus,
  Chain,
  IntentStatus,
  UserRole,
  UserStatus,
} from '../../src/common/enums/domain.enums';
import { PresaleStateEntity } from '../../src/modules/presale/entities/presale-state.entity';
import { PresaleTierEntity } from '../../src/modules/presale/entities/presale-tier.entity';
import { AssetPriceEntity } from '../../src/modules/pricing/entities/asset-price.entity';
import { SupportedAssetEntity } from '../../src/modules/pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../../src/modules/purchase-intents/entities/purchase-intent.entity';
import { TokenAllocationEntity } from '../../src/modules/transactions/entities/token-allocation.entity';
import { WalletChallengeEntity } from '../../src/modules/wallets/entities/wallet-challenge.entity';
import { WalletEntity } from '../../src/modules/wallets/entities/wallet.entity';
import { UserProfileEntity } from '../../src/infrastructure/database/entities/user-profile.entity';
import { addFixed, divideFixed, multiplyFixed } from '../../src/common/utils/decimal';

const { Client } = require('pg') as { Client: new (args: { connectionString: string }) => any };

const PRESALE_STATE_ID = '00000000-0000-0000-0000-000000000001';

const TEST_PRIVATE_KEYS = {
  user: '0x59c6995e998f97a5a0044966f094538c5f43b0f8b7d2f1c8f3f1ce5d1a0f8f6f',
  other: '0x8b3a350cf5c34c9194ca3c4b7c8a6dff3cb590c9b0f1d55d26ab9dd98ec6053f',
  admin: '0x4c0883a69102937d6231471b5dbb6204fe5129617082794e7b9d0d7db4aefb23',
} as const;

export const TEST_EVM_WALLETS = {
  user: new Wallet(TEST_PRIVATE_KEYS.user),
  other: new Wallet(TEST_PRIVATE_KEYS.other),
  admin: new Wallet(TEST_PRIVATE_KEYS.admin),
};

export type Phase2Seed = {
  users: {
    user: { id: string; email: string; role: UserRole; status: UserStatus };
    other: { id: string; email: string; role: UserRole; status: UserStatus };
    admin: { id: string; email: string; role: UserRole; status: UserStatus };
    suspended: { id: string; email: string; role: UserRole; status: UserStatus };
  };
  assets: {
    eth: SupportedAssetEntity;
    usdtErc20: SupportedAssetEntity;
    usdtTrc20: SupportedAssetEntity;
  };
  tiers: {
    first: PresaleTierEntity;
    second: PresaleTierEntity;
  };
  state: PresaleStateEntity;
};

export type TestContext = {
  app: INestApplication;
  dataSource: DataSource;
};

let envConfigured = false;

function getBaseEnvPath(): string {
  return join(__dirname, '../../.env');
}

function deriveTestDatabaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  const databaseName = url.pathname.replace(/^\//, '');
  const testDatabaseName = process.env.TEST_DATABASE_NAME ?? `${databaseName}_phase2_test`;
  if (url.hostname === 'localhost') {
    url.hostname = '127.0.0.1';
  }
  url.pathname = `/${testDatabaseName}`;
  return url.toString();
}

export function ensurePhase2TestEnv(): void {
  if (envConfigured) {
    return;
  }

  loadEnv({ path: getBaseEnvPath() });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run Phase 2 backend tests');
  }

  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@localhost', '@127.0.0.1');
  process.env.REDIS_URL = (process.env.REDIS_URL ?? 'redis://127.0.0.1:6379').replace(
    'localhost',
    '127.0.0.1',
  );
  process.env.TEST_DATABASE_URL ??= deriveTestDatabaseUrl(process.env.DATABASE_URL);
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.INTERNAL_AUTH_JWT_SECRET ??= 'phase2-test-secret';
  process.env.INTERNAL_AUTH_ISSUER ??= 'fe-bff';
  process.env.INTERNAL_AUTH_AUDIENCE ??= 'be-api';
  process.env.PORT ??= '3002';

  envConfigured = true;
}

export async function ensurePhase2TestDatabaseExists(): Promise<void> {
  ensurePhase2TestEnv();

  const testUrl = new URL(process.env.DATABASE_URL!);
  const databaseName = testUrl.pathname.replace(/^\//, '');
  const adminUrl = new URL(testUrl.toString());
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
  }

  await client.end();
}

export async function resetPhase2TestDatabase(): Promise<void> {
  ensurePhase2TestEnv();
  await ensurePhase2TestDatabaseExists();

  const { default: migrationDataSource } = await import('../../src/infrastructure/database/data-source');

  if (migrationDataSource.isInitialized) {
    await migrationDataSource.destroy();
  }

  await migrationDataSource.initialize();
  await migrationDataSource.dropDatabase();
  await migrationDataSource.runMigrations();
  await migrationDataSource.destroy();
}

export async function bootstrapPhase2App(): Promise<TestContext> {
  ensurePhase2TestEnv();

  const { AppModule } = await import('../../src/app.module');
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return {
    app,
    dataSource: app.get(DataSource),
  };
}

export async function shutdownPhase2App(context: TestContext): Promise<void> {
  if (context?.app) {
    await context.app.close();
  }
}

export async function truncatePhase2Tables(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    TRUNCATE TABLE
      admin_audit_logs,
      refunds,
      token_allocations,
      blockchain_transactions,
      purchase_intents,
      wallet_challenges,
      wallets,
      asset_prices,
      supported_assets,
      presale_state,
      presale_tiers,
      user_profiles,
      auth_verifications,
      auth_accounts,
      auth_sessions,
      auth_users
    RESTART IDENTITY CASCADE
  `);
}

export async function seedPhase2Base(
  dataSource: DataSource,
  options?: { staleAssetCodes?: string[] },
): Promise<Phase2Seed> {
  const staleAssetCodes = new Set(options?.staleAssetCodes ?? []);

  const userProfilesRepository = dataSource.getRepository(UserProfileEntity);
  const supportedAssetsRepository = dataSource.getRepository(SupportedAssetEntity);
  const assetPricesRepository = dataSource.getRepository(AssetPriceEntity);
  const presaleTiersRepository = dataSource.getRepository(PresaleTierEntity);
  const presaleStateRepository = dataSource.getRepository(PresaleStateEntity);

  const users = {
    user: {
      id: 'phase2-user',
      email: 'user@flowdex.test',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
    other: {
      id: 'phase2-user-other',
      email: 'other@flowdex.test',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
    admin: {
      id: 'phase2-admin',
      email: 'admin@flowdex.test',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    suspended: {
      id: 'phase2-suspended',
      email: 'suspended@flowdex.test',
      role: UserRole.USER,
      status: UserStatus.SUSPENDED,
    },
  };

  await userProfilesRepository.save(
    Object.values(users).map((user) =>
      userProfilesRepository.create({
        userId: user.id,
        role: user.role,
        status: user.status,
      }),
    ),
  );

  const [eth, usdtErc20, usdtTrc20] = await supportedAssetsRepository.save([
    supportedAssetsRepository.create({
      assetCode: 'ETH',
      chain: Chain.ETH,
      symbol: 'ETH',
      contractAddress: null,
      decimals: 18,
      treasuryAddress: '0x1000000000000000000000000000000000000001',
      minConfirmations: 1,
      minAmount: '0.1',
      isActive: true,
    }),
    supportedAssetsRepository.create({
      assetCode: 'USDT_ERC20',
      chain: Chain.ERC20,
      symbol: 'USDT',
      contractAddress: '0x2000000000000000000000000000000000000002',
      decimals: 6,
      treasuryAddress: '0x3000000000000000000000000000000000000003',
      minConfirmations: 2,
      minAmount: '50',
      isActive: true,
    }),
    supportedAssetsRepository.create({
      assetCode: 'USDT_TRC20',
      chain: Chain.TRC20,
      symbol: 'USDT',
      contractAddress: 'TGzz8vjFb8jAz2K8WS7pPjH1Wc6p4QvXvt',
      decimals: 6,
      treasuryAddress: 'TQd22wygQN5D4hFkiVHp5R5iNet8Q6hNqC',
      minConfirmations: 20,
      minAmount: '50',
      isActive: false,
    }),
  ]);

  const savedPrices = await assetPricesRepository.save([
    assetPricesRepository.create({
      assetId: eth.id,
      priceUsd: '2000',
      source: 'test-fixture',
    }),
    assetPricesRepository.create({
      assetId: usdtErc20.id,
      priceUsd: '1',
      source: 'test-fixture',
    }),
    assetPricesRepository.create({
      assetId: usdtTrc20.id,
      priceUsd: '1',
      source: 'test-fixture',
    }),
  ]);

  if (staleAssetCodes.size > 0) {
    const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const assetMap = new Map([
      ['ETH', eth.id],
      ['USDT_ERC20', usdtErc20.id],
      ['USDT_TRC20', usdtTrc20.id],
    ]);

    for (const assetCode of staleAssetCodes) {
      const assetId = assetMap.get(assetCode);
      if (assetId) {
        await dataSource.query('UPDATE asset_prices SET updated_at = $1 WHERE asset_id = $2', [
          staleTimestamp,
          assetId,
        ]);
      }
    }
  }

  const [firstTier, secondTier] = await presaleTiersRepository.save([
    presaleTiersRepository.create({
      sortOrder: 1,
      tokenPriceUsd: '0.001',
      tokenCapReal: '1000000',
      isActive: true,
    }),
    presaleTiersRepository.create({
      sortOrder: 2,
      tokenPriceUsd: '0.002',
      tokenCapReal: '2000000',
      isActive: true,
    }),
  ]);

  const state = await presaleStateRepository.save(
    presaleStateRepository.create({
      id: PRESALE_STATE_ID,
      currentTierId: firstTier.id,
      totalRaisedUsdReal: '0',
      totalTokensSoldReal: '0',
      displayMultiplier: 10,
    }),
  );

  void savedPrices;

  return {
    users,
    assets: {
      eth,
      usdtErc20,
      usdtTrc20,
    },
    tiers: {
      first: firstTier,
      second: secondTier,
    },
    state,
  };
}

export async function seedVerifiedWallet(
  dataSource: DataSource,
  userId: string,
  wallet: Wallet,
  chain: Chain = Chain.ETH,
): Promise<WalletEntity> {
  const walletsRepository = dataSource.getRepository(WalletEntity);

  return walletsRepository.save(
    walletsRepository.create({
      userId,
      chain,
      addressRaw: wallet.address,
      addressNormalized: wallet.address,
      isPrimary: true,
      verifiedAt: new Date(),
    }),
  );
}

export async function seedPurchaseIntent(
  dataSource: DataSource,
  params: {
    userId: string;
    walletId: string;
    assetId: string;
    paymentAddress: string;
    expectedAmount: string;
    quotedAssetPriceUsd: string;
    quotedTokenPriceUsd: string;
    expectedTokensReal: string;
    status?: IntentStatus;
    reportedTxHash?: string | null;
    matchedBlockchainTxId?: string | null;
    failureReason?: string | null;
    confirmedAt?: Date | null;
    expiresAt?: Date;
  },
): Promise<PurchaseIntentEntity> {
  const purchaseIntentsRepository = dataSource.getRepository(PurchaseIntentEntity);

  return purchaseIntentsRepository.save(
    purchaseIntentsRepository.create({
      userId: params.userId,
      walletId: params.walletId,
      assetId: params.assetId,
      paymentAddress: params.paymentAddress,
      expectedAmount: params.expectedAmount,
      quotedAssetPriceUsd: params.quotedAssetPriceUsd,
      quotedTokenPriceUsd: params.quotedTokenPriceUsd,
      expectedTokensReal: params.expectedTokensReal,
      status: params.status ?? IntentStatus.PENDING,
      reportedTxHash: params.reportedTxHash ?? null,
      matchedBlockchainTxId: params.matchedBlockchainTxId ?? null,
      failureReason: params.failureReason ?? null,
      confirmedAt: params.confirmedAt ?? null,
      expiresAt: params.expiresAt ?? new Date(Date.now() + 15 * 60 * 1000),
    }),
  );
}

export async function seedConfirmedIntent(
  dataSource: DataSource,
  params: {
    userId: string;
    wallet: WalletEntity;
    asset: SupportedAssetEntity;
    amount: string;
    txHash?: string;
  },
): Promise<{
    intent: PurchaseIntentEntity;
    blockchainTransaction: BlockchainTransactionEntity;
    allocation: TokenAllocationEntity;
  }> {
  const assetPricesRepository = dataSource.getRepository(AssetPriceEntity);
  const purchaseIntentsRepository = dataSource.getRepository(PurchaseIntentEntity);
  const blockchainTransactionsRepository = dataSource.getRepository(BlockchainTransactionEntity);
  const tokenAllocationsRepository = dataSource.getRepository(TokenAllocationEntity);
  const presaleStateRepository = dataSource.getRepository(PresaleStateEntity);
  const presaleTiersRepository = dataSource.getRepository(PresaleTierEntity);

  const price = await assetPricesRepository.findOneByOrFail({ assetId: params.asset.id });
  const tier = await presaleTiersRepository.findOneByOrFail({ sortOrder: 1 });
  const tokensReal = divideFixed(
    multiplyFixed(params.amount, price.priceUsd),
    tier.tokenPriceUsd,
  );
  const confirmedAt = new Date();

  const intent = await purchaseIntentsRepository.save(
    purchaseIntentsRepository.create({
      userId: params.userId,
      walletId: params.wallet.id,
      assetId: params.asset.id,
      paymentAddress: params.asset.treasuryAddress,
      expectedAmount: params.amount,
      quotedAssetPriceUsd: price.priceUsd,
      quotedTokenPriceUsd: tier.tokenPriceUsd,
      expectedTokensReal: tokensReal,
      status: IntentStatus.CONFIRMED,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      confirmedAt,
    }),
  );

  const blockchainTransaction = await blockchainTransactionsRepository.save(
    blockchainTransactionsRepository.create({
      chain: params.asset.chain,
      assetId: params.asset.id,
      txHash: params.txHash ?? `0x${'a'.repeat(63)}1`,
      transferIndex: 0,
      fromAddress: params.wallet.addressNormalized,
      toAddress: params.asset.treasuryAddress,
      amount: params.amount,
      blockNumber: '123',
      blockTime: confirmedAt,
      confirmations: params.asset.minConfirmations,
      status: BlockchainTxStatus.CONFIRMED,
      matchedIntentId: intent.id,
      rawPayload: {
        source: 'test-fixture',
      },
      reconciliationReason: null,
    }),
  );

  intent.matchedBlockchainTxId = blockchainTransaction.id;
  await purchaseIntentsRepository.save(intent);

  const allocation = await tokenAllocationsRepository.save(
    tokenAllocationsRepository.create({
      userId: params.userId,
      purchaseIntentId: intent.id,
      tierId: tier.id,
      tokensReal,
    }),
  );

  const state = await presaleStateRepository.findOneByOrFail({ id: PRESALE_STATE_ID });
  state.totalRaisedUsdReal = addFixed(
    state.totalRaisedUsdReal,
    multiplyFixed(params.amount, price.priceUsd),
  );
  state.totalTokensSoldReal = addFixed(state.totalTokensSoldReal, tokensReal);
  await presaleStateRepository.save(state);

  return { intent, blockchainTransaction, allocation };
}

export async function seedUnmatchedBlockchainTransaction(
  dataSource: DataSource,
  params: {
    asset: SupportedAssetEntity;
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    reconciliationReason?: string | null;
  },
): Promise<BlockchainTransactionEntity> {
  const repository = dataSource.getRepository(BlockchainTransactionEntity);

  return repository.save(
    repository.create({
      chain: params.asset.chain,
      assetId: params.asset.id,
      txHash: params.txHash,
      transferIndex: 0,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      amount: params.amount,
      blockNumber: '321',
      blockTime: new Date(),
      confirmations: 0,
      status: BlockchainTxStatus.UNMATCHED,
      matchedIntentId: null,
      rawPayload: {
        source: 'test-fixture',
      },
      reconciliationReason: params.reconciliationReason ?? 'TREASURY_ADDRESS_MISMATCH',
    }),
  );
}

export function createInternalAuthToken(params: {
  sub: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}): string {
  ensurePhase2TestEnv();

  const jwtService = new JwtService({
    secret: process.env.INTERNAL_AUTH_JWT_SECRET,
    signOptions: {
      issuer: process.env.INTERNAL_AUTH_ISSUER,
      audience: process.env.INTERNAL_AUTH_AUDIENCE,
      expiresIn: '15m',
    },
  });

  return jwtService.sign({
    sub: params.sub,
    email: params.email,
    role: params.role,
    sessionId: params.sessionId ?? `${params.sub}-session`,
  });
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function getAuditLogCount(dataSource: DataSource): Promise<number> {
  return dataSource.getRepository(AdminAuditLogEntity).count();
}

export async function getRefundRepository(dataSource: DataSource): Promise<Repository<RefundEntity>> {
  return dataSource.getRepository(RefundEntity);
}

export async function getWalletChallengeRepository(
  dataSource: DataSource,
): Promise<Repository<WalletChallengeEntity>> {
  return dataSource.getRepository(WalletChallengeEntity);
}

export async function getPurchaseIntentRepository(
  dataSource: DataSource,
): Promise<Repository<PurchaseIntentEntity>> {
  return dataSource.getRepository(PurchaseIntentEntity);
}

export async function getBlockchainTransactionRepository(
  dataSource: DataSource,
): Promise<Repository<BlockchainTransactionEntity>> {
  return dataSource.getRepository(BlockchainTransactionEntity);
}

export async function getTokenAllocationRepository(
  dataSource: DataSource,
): Promise<Repository<TokenAllocationEntity>> {
  return dataSource.getRepository(TokenAllocationEntity);
}

export async function getPresaleStateRepository(
  dataSource: DataSource,
): Promise<Repository<PresaleStateEntity>> {
  return dataSource.getRepository(PresaleStateEntity);
}
