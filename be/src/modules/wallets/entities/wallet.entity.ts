import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Chain, WalletProvider, WalletTrustLevel } from '../../../common/enums/domain.enums';

@Entity('wallets')
@Index('IDX_wallet_chain_id_address', ['chainId', 'addressNormalized'], { unique: true })
@Index('IDX_wallet_primary_per_user_chain', ['userId', 'chain'], {
  unique: true,
  where: '"is_primary" = true',
})
@Index('IDX_wallet_user_network_primary', ['userId', 'network'], {
  unique: true,
  where: '"is_primary" = true AND "network" IS NOT NULL',
})
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 20, enum: Chain })
  chain!: Chain;

  @Column({ name: 'chain_id', type: 'int' })
  chainId!: number;

  @Column({ name: 'address_raw', type: 'varchar', length: 255 })
  addressRaw!: string;

  @Column({ name: 'address_normalized', type: 'varchar', length: 255 })
  addressNormalized!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  network!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true, enum: WalletProvider })
  provider!: WalletProvider | null;

  @Column({
    name: 'trust_level',
    type: 'varchar',
    length: 40,
    nullable: true,
    enum: WalletTrustLevel,
  })
  trustLevel!: WalletTrustLevel | null;

  @Column({ name: 'alchemy_account_id', type: 'varchar', length: 255, nullable: true })
  alchemyAccountId!: string | null;

  @Column({ name: 'alchemy_wallet_id', type: 'varchar', length: 255, nullable: true })
  alchemyWalletId!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
