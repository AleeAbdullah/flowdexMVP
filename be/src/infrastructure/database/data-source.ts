import 'dotenv/config';
import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { AnalyticsSnapshotEntity } from '../../modules/transactions/entities/analytics-snapshot.entity';
import { LedgerTransactionEntity } from '../../modules/transactions/entities/ledger-transaction.entity';
import { SimulationIntentEntity } from '../../modules/transactions/entities/simulation-intent.entity';
import { SyncCheckpointEntity } from '../../modules/transactions/entities/sync-checkpoint.entity';
import { WebhookDeliveryEntity } from '../../modules/transactions/entities/webhook-delivery.entity';
import { WalletEntity } from '../../modules/wallets/entities/wallet.entity';
import {
  AuthAccountEntity,
  AuthSessionEntity,
  AuthUserEntity,
  AuthVerificationEntity,
} from './entities/auth.entities';
import { UserProfileEntity } from './entities/user-profile.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [
    AuthUserEntity,
    AuthSessionEntity,
    AuthAccountEntity,
    AuthVerificationEntity,
    UserProfileEntity,
    WalletEntity,
    LedgerTransactionEntity,
    SimulationIntentEntity,
    WebhookDeliveryEntity,
    SyncCheckpointEntity,
    AnalyticsSnapshotEntity,
  ],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
});
