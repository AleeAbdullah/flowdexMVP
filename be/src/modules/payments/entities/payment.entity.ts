import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentAsset, PaymentChain, PaymentStatus } from '../payments.types';
import { PaymentIntentEntity } from './payment-intent.entity';

@Entity('payments')
@Index('IDX_payments_intent_unique', ['intentId'], { unique: true })
@Index('IDX_payments_chain_hash_receiver_unique', ['chain', 'txHash', 'receiverAddress'], {
  unique: true,
  where: '"tx_hash" IS NOT NULL',
})
@Index('IDX_payments_btc_output_unique', ['chain', 'txHash', 'outputIndex'], {
  unique: true,
  where: '"tx_hash" IS NOT NULL AND "output_index" IS NOT NULL',
})
@Index('IDX_payments_sender_created', ['senderAddress', 'createdAt'])
@Index('IDX_payments_status_chain', ['status', 'chain'])
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'intent_id', type: 'uuid', unique: true })
  intentId!: string;

  @ManyToOne(() => PaymentIntentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'intent_id' })
  intent!: PaymentIntentEntity;

  @Column({ type: 'varchar', length: 24 })
  chain!: PaymentChain;

  @Column({ type: 'varchar', length: 12 })
  asset!: PaymentAsset;

  @Column({ name: 'amount_base_units', type: 'numeric', precision: 78, scale: 0 })
  amountBaseUnits!: string;

  @Column({ name: 'sender_address', type: 'varchar', length: 255, nullable: true })
  senderAddress!: string | null;

  @Column({ name: 'receiver_address', type: 'varchar', length: 255 })
  receiverAddress!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true })
  txHash!: string | null;

  @Column({ name: 'output_index', type: 'int', nullable: true })
  outputIndex!: number | null;

  @Column({ type: 'varchar', length: 24 })
  status!: PaymentStatus;

  @Column({ name: 'block_number', type: 'varchar', length: 64, nullable: true })
  blockNumber!: string | null;

  @Column({ type: 'int', default: 0 })
  confirmations!: number;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
