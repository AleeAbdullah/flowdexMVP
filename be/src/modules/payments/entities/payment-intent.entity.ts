import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentAsset, PaymentChain, PaymentIntentStatus } from '../payments.types';

@Entity('payment_intents')
@Index('IDX_payment_intents_btc_receiver_unique', ['receiverAddress'], {
  unique: true,
  where: '"chain" = \'BITCOIN\'',
})
@Index('IDX_payment_intents_btc_derivation_index_unique', ['btcDerivationIndex'], {
  unique: true,
  where: '"btc_derivation_index" IS NOT NULL',
})
@Index('IDX_payment_intents_solana_reference_unique', ['solanaReference'], {
  unique: true,
  where: '"solana_reference" IS NOT NULL',
})
@Index('IDX_payment_intents_status_checked', ['status', 'lastCheckedAt'])
@Index('IDX_payment_intents_sender_created', ['senderAddress', 'createdAt'])
export class PaymentIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 24 })
  chain!: PaymentChain;

  @Column({ type: 'varchar', length: 12 })
  asset!: PaymentAsset;

  @Column({ name: 'token_amount', type: 'numeric', precision: 36, scale: 18 })
  tokenAmount!: string;

  @Column({ name: 'token_price_usd', type: 'numeric', precision: 36, scale: 18 })
  tokenPriceUsd!: string;

  @Column({ name: 'usd_amount', type: 'numeric', precision: 36, scale: 18 })
  usdAmount!: string;

  @Column({ name: 'quote_currency', type: 'varchar', length: 8, default: 'USD' })
  quoteCurrency!: string;

  @Column({ name: 'quote_price_usd', type: 'numeric', precision: 36, scale: 18 })
  quotePriceUsd!: string;

  @Column({ name: 'quoted_at', type: 'timestamptz' })
  quotedAt!: Date;

  @Column({ name: 'quote_expires_at', type: 'timestamptz' })
  quoteExpiresAt!: Date;

  @Column({ name: 'expected_amount_base_units', type: 'numeric', precision: 78, scale: 0 })
  expectedAmountBaseUnits!: string;

  @Column({ name: 'sender_address', type: 'varchar', length: 255, nullable: true })
  senderAddress!: string | null;

  @Column({ name: 'request_ip', type: 'varchar', length: 96, nullable: true })
  requestIp!: string | null;

  @Column({ name: 'checkout_token_hash', type: 'varchar', length: 64, nullable: true })
  checkoutTokenHash!: string | null;

  @Column({ name: 'receiver_address', type: 'varchar', length: 255 })
  receiverAddress!: string;

  @Column({ name: 'solana_reference', type: 'varchar', length: 255, nullable: true })
  solanaReference!: string | null;

  @Column({ name: 'eth_created_block_number', type: 'varchar', length: 64, nullable: true })
  ethCreatedBlockNumber!: string | null;

  @Column({ name: 'tron_created_block_number', type: 'varchar', length: 64, nullable: true })
  tronCreatedBlockNumber!: string | null;

  @Column({ name: 'btc_derivation_index', type: 'int', nullable: true })
  btcDerivationIndex!: number | null;

  @Column({ name: 'btc_derivation_path', type: 'varchar', length: 128, nullable: true })
  btcDerivationPath!: string | null;

  @Column({ type: 'varchar', length: 24, default: PaymentIntentStatus.WAITING })
  status!: PaymentIntentStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'last_checked_at', type: 'timestamptz', nullable: true })
  lastCheckedAt!: Date | null;

  @Column({ name: 'last_check_result', type: 'jsonb', nullable: true })
  lastCheckResult!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
