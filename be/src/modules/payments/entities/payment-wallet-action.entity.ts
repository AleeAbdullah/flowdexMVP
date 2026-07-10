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

import {
  PaymentChain,
  PaymentWalletActionKind,
  PaymentWalletActionStatus,
  PaymentWalletTxIdKind,
} from '../payments.types';
import { PaymentIntentEntity } from './payment-intent.entity';

@Entity('payment_wallet_actions')
@Index('IDX_payment_wallet_actions_intent_status', ['paymentIntentId', 'status'])
@Index('IDX_payment_wallet_actions_sender_created', ['senderAddress', 'createdAt'])
@Index('IDX_payment_wallet_actions_evm_tx_unique', ['txIdKind', 'txId'], {
  unique: true,
  where: '"tx_id_kind" = \'evm_tx_hash\' AND "tx_id" IS NOT NULL',
})
@Index('IDX_payment_wallet_actions_solana_signature_unique', ['txIdKind', 'txId'], {
  unique: true,
  where: '"tx_id_kind" = \'solana_signature\' AND "tx_id" IS NOT NULL',
})
@Index('IDX_payment_wallet_actions_tron_tx_unique', ['txIdKind', 'txId'], {
  unique: true,
  where: '"tx_id_kind" = \'tron_tx_hash\' AND "tx_id" IS NOT NULL',
})
export class PaymentWalletActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'payment_intent_id', type: 'uuid' })
  paymentIntentId!: string;

  @ManyToOne(() => PaymentIntentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent!: PaymentIntentEntity;

  @Column({ type: 'varchar', length: 24 })
  chain!: PaymentChain;

  @Column({ name: 'action_kind', type: 'varchar', length: 32 })
  actionKind!: PaymentWalletActionKind;

  @Column({ name: 'sender_address', type: 'varchar', length: 255 })
  senderAddress!: string;

  @Column({ name: 'wallet_chain_id', type: 'varchar', length: 64, nullable: true })
  walletChainId!: string | null;

  @Column({ type: 'varchar', length: 24, default: PaymentWalletActionStatus.PREPARED })
  status!: PaymentWalletActionStatus;

  @Column({ name: 'request_json', type: 'jsonb' })
  requestJson!: Record<string, unknown>;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ name: 'tx_id', type: 'varchar', length: 255, nullable: true })
  txId!: string | null;

  @Column({ name: 'tx_id_kind', type: 'varchar', length: 32, nullable: true })
  txIdKind!: PaymentWalletTxIdKind | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
