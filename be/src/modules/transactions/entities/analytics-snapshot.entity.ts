import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('analytics_snapshots')
@Index('IDX_analytics_snapshot_user', ['userId'], { unique: true })
export class AnalyticsSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'linked_wallet_count', type: 'int', default: 0 })
  linkedWalletCount!: number;

  @Column({ name: 'total_transaction_count', type: 'int', default: 0 })
  totalTransactionCount!: number;

  @Column({ name: 'confirmed_transaction_count', type: 'int', default: 0 })
  confirmedTransactionCount!: number;

  @Column({ name: 'pending_transaction_count', type: 'int', default: 0 })
  pendingTransactionCount!: number;

  @Column({ name: 'total_volume', type: 'numeric', precision: 36, scale: 18, default: 0 })
  totalVolume!: string;

  @Column({ name: 'last_transaction_at', type: 'timestamptz', nullable: true })
  lastTransactionAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
