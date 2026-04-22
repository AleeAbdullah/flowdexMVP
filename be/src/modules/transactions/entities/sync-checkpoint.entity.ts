import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sync_checkpoints')
@Index('IDX_sync_checkpoint_wallet_network', ['walletId', 'network'], { unique: true })
export class SyncCheckpointEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId!: string;

  @Column({ type: 'varchar', length: 40 })
  network!: string;

  @Column({ name: 'last_page_key', type: 'varchar', length: 255, nullable: true })
  lastPageKey!: string | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
