import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RefundStatus } from '../../../common/enums/domain.enums';

@Entity('refunds')
@Index(['purchaseIntentId'], { unique: true })
export class RefundEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'purchase_intent_id', type: 'uuid' })
  purchaseIntentId!: string;

  @Column({ name: 'approved_by_user_id', type: 'varchar', length: 255 })
  approvedByUserId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'refund_amount', type: 'numeric', precision: 36, scale: 18 })
  refundAmount!: string;

  @Column({ name: 'destination_address', type: 'varchar', length: 255 })
  destinationAddress!: string;

  @Column({ name: 'outbound_tx_hash', type: 'varchar', length: 255, nullable: true })
  outboundTxHash!: string | null;

  @Column({ type: 'varchar', length: 20, enum: RefundStatus, default: RefundStatus.APPROVED })
  status!: RefundStatus;

  @Column({ type: 'text' })
  reason!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;
}
