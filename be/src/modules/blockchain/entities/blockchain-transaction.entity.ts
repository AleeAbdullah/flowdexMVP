import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

import { BlockchainTxStatus, Chain } from '../../../common/enums/domain.enums';

@Entity('blockchain_transactions')
@Index(['chain', 'txHash', 'transferIndex'], { unique: true })
export class BlockchainTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, enum: Chain })
  chain!: Chain;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255 })
  txHash!: string;

  @Column({ name: 'transfer_index', type: 'int' })
  transferIndex!: number;

  @Column({ name: 'from_address', type: 'varchar', length: 255 })
  fromAddress!: string;

  @Column({ name: 'to_address', type: 'varchar', length: 255 })
  toAddress!: string;

  @Column({ type: 'numeric', precision: 36, scale: 18 })
  amount!: string;

  @Column({ name: 'block_number', type: 'bigint' })
  blockNumber!: string;

  @Column({ name: 'block_time', type: 'timestamptz' })
  blockTime!: Date;

  @Column({ type: 'int', default: 0 })
  confirmations!: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: BlockchainTxStatus,
    default: BlockchainTxStatus.DETECTED,
  })
  status!: BlockchainTxStatus;

  @Column({ name: 'matched_intent_id', type: 'uuid', nullable: true })
  matchedIntentId!: string | null;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
