import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { IntentStatus } from '../../../common/enums/domain.enums';

@Entity('purchase_intents')
export class PurchaseIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'payment_address', type: 'varchar', length: 255 })
  paymentAddress!: string;

  @Column({ name: 'expected_amount', type: 'numeric', precision: 36, scale: 18 })
  expectedAmount!: string;

  @Column({ name: 'quoted_asset_price_usd', type: 'numeric', precision: 36, scale: 18 })
  quotedAssetPriceUsd!: string;

  @Column({ name: 'quoted_token_price_usd', type: 'numeric', precision: 36, scale: 18 })
  quotedTokenPriceUsd!: string;

  @Column({ name: 'expected_tokens_real', type: 'numeric', precision: 36, scale: 18 })
  expectedTokensReal!: string;

  @Column({ type: 'varchar', length: 20, enum: IntentStatus, default: IntentStatus.PENDING })
  status!: IntentStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'reported_tx_hash', type: 'varchar', length: 255, nullable: true })
  reportedTxHash!: string | null;

  @Column({ name: 'matched_blockchain_tx_id', type: 'uuid', nullable: true })
  matchedBlockchainTxId!: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 120, nullable: true })
  failureReason!: string | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
