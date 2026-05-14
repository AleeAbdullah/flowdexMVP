import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ledger_transactions')
@Index('IDX_ledger_tx_owner_chain', ['ownerWalletAddressNormalized', 'chainId'])
@Index('IDX_ledger_tx_owner_created', ['ownerWalletAddressNormalized', 'createdAt'])
@Index('IDX_ledger_tx_chain_hash_unique', ['chainId', 'txHash'], {
  unique: true,
  where: '"tx_hash" IS NOT NULL',
})
@Index('IDX_ledger_tx_public_id', ['publicId'], { unique: true })
export class LedgerTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  publicId!: string;

  @Column({ name: 'owner_wallet_address_normalized', type: 'varchar', length: 64 })
  ownerWalletAddressNormalized!: string;

  @Column({ name: 'owner_wallet_address_checksum', type: 'varchar', length: 64 })
  ownerWalletAddressChecksum!: string;

  @Column({ type: 'varchar', length: 40 })
  network!: string;

  @Column({ name: 'chain_id', type: 'int' })
  chainId!: number;

  @Column({ name: 'asset_type', type: 'varchar', length: 16 })
  assetType!: 'native' | 'erc20';

  @Column({ name: 'asset_code', type: 'varchar', length: 64 })
  assetCode!: string;

  @Column({ name: 'asset_contract_address', type: 'varchar', length: 64, nullable: true })
  assetContractAddress!: string | null;

  @Column({ name: 'asset_decimals', type: 'int' })
  assetDecimals!: number;

  @Column({ name: 'amount_base_units', type: 'numeric', precision: 78, scale: 0 })
  amountBaseUnits!: string;

  @Column({ name: 'amount_display', type: 'varchar', length: 128 })
  amountDisplay!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ name: 'tx_hash', type: 'varchar', length: 255, nullable: true })
  txHash!: string | null;

  @Column({ name: 'expected_recipient_address', type: 'varchar', length: 64 })
  expectedRecipientAddress!: string;

  @Column({ name: 'actual_from_address', type: 'varchar', length: 64, nullable: true })
  actualFromAddress!: string | null;

  @Column({ name: 'actual_to_address', type: 'varchar', length: 64, nullable: true })
  actualToAddress!: string | null;

  @Column({ name: 'actual_amount_base_units', type: 'numeric', precision: 78, scale: 0, nullable: true })
  actualAmountBaseUnits!: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 160, nullable: true })
  failureReason!: string | null;

  @Column({ name: 'block_number', type: 'varchar', length: 64, nullable: true })
  blockNumber!: string | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'simulation_id', type: 'uuid', nullable: true })
  simulationId!: string | null;

  @Column({ name: 'raw_track_payload', type: 'jsonb', nullable: true })
  rawTrackPayload!: Record<string, unknown> | null;

  @Column({ name: 'raw_webhook_payload', type: 'jsonb', nullable: true })
  rawWebhookPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
