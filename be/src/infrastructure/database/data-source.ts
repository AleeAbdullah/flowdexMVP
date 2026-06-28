import '../config/load-env';
import 'reflect-metadata';

import { join } from 'node:path';
import { DataSource } from 'typeorm';

import { AnalyticsSnapshotEntity } from '../../modules/transactions/entities/analytics-snapshot.entity';
import { PaymentIntentEntity } from '../../modules/payments/entities/payment-intent.entity';
import { PaymentEntity } from '../../modules/payments/entities/payment.entity';
import { PaymentWalletActionEntity } from '../../modules/payments/entities/payment-wallet-action.entity';
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
    PaymentIntentEntity,
    PaymentEntity,
    PaymentWalletActionEntity,
    LedgerTransactionEntity,
    SimulationIntentEntity,
    WebhookDeliveryEntity,
    SyncCheckpointEntity,
    AnalyticsSnapshotEntity,
  ],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
});
