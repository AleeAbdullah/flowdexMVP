import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('simulation_intents')
@Index('IDX_simulation_intent_wallet_created', ['walletAddressNormalized', 'createdAt'])
@Index('IDX_simulation_intent_wallet_status', ['walletAddressNormalized', 'status'])
export class SimulationIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'wallet_address_normalized', type: 'varchar', length: 64 })
  walletAddressNormalized!: string;

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

  @Column({ name: 'expected_recipient_address', type: 'varchar', length: 64 })
  expectedRecipientAddress!: string;

  @Column({ type: 'varchar', length: 24, default: 'created' })
  status!: 'created' | 'used' | 'expired' | 'cancelled';

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ name: 'request_payload', type: 'jsonb', nullable: true })
  requestPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
