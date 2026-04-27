import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ledger_transactions')
@Index('IDX_ledger_tx_user_created', ['userId', 'createdAt'])
@Index('IDX_ledger_tx_wallet_network_hash', ['walletId', 'network', 'txHash'])
@Index('IDX_ledger_tx_chain_hash_unique', ['chainId', 'txHash'], {
  unique: true,
  where: '"tx_hash" IS NOT NULL',
})
@Index('IDX_ledger_tx_operation_id', ['operationId'], { unique: true, where: '"operation_id" IS NOT NULL' })
export class LedgerTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId!: string;

  @Column({ type: 'varchar', length: 40 })
  network!: string;

  @Column({ name: 'chain_id', type: 'int', nullable: true })
  chainId!: number | null;

  @Column({ name: 'asset_code', type: 'varchar', length: 64 })
  assetCode!: string;

  @Column({ type: 'numeric', precision: 36, scale: 18 })
  amount!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ name: 'operation_id', type: 'varchar', length: 255, nullable: true })
  operationId!: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true })
  txHash!: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 160, nullable: true })
  failureReason!: string | null;

  @Column({ name: 'block_number', type: 'varchar', length: 64, nullable: true })
  blockNumber!: string | null;

  @Column({ name: 'block_time', type: 'timestamptz', nullable: true })
  blockTime!: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'raw_track_payload', type: 'jsonb', nullable: true })
  rawTrackPayload!: Record<string, unknown> | null;

  @Column({ name: 'raw_webhook_payload', type: 'jsonb', nullable: true })
  rawWebhookPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
