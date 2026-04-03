import 'dotenv/config';
import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { AdminAuditLogEntity } from '../../modules/admin/entities/admin-audit-log.entity';
import { RefundEntity } from '../../modules/admin/entities/refund.entity';
import { BlockchainTransactionEntity } from '../../modules/blockchain/entities/blockchain-transaction.entity';
import { PresaleStateEntity } from '../../modules/presale/entities/presale-state.entity';
import { PresaleTierEntity } from '../../modules/presale/entities/presale-tier.entity';
import { AssetPriceEntity } from '../../modules/pricing/entities/asset-price.entity';
import { SupportedAssetEntity } from '../../modules/pricing/entities/supported-asset.entity';
import { PurchaseIntentEntity } from '../../modules/purchase-intents/entities/purchase-intent.entity';
import { TokenAllocationEntity } from '../../modules/transactions/entities/token-allocation.entity';
import { WalletChallengeEntity } from '../../modules/wallets/entities/wallet-challenge.entity';
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
    WalletChallengeEntity,
    SupportedAssetEntity,
    AssetPriceEntity,
    PresaleTierEntity,
    PresaleStateEntity,
    PurchaseIntentEntity,
    BlockchainTransactionEntity,
    TokenAllocationEntity,
    RefundEntity,
    AdminAuditLogEntity,
  ],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
});
