import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Chain } from '../../../common/enums/domain.enums';

@Entity('supported_assets')
export class SupportedAssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'asset_code', type: 'varchar', length: 50, unique: true })
  assetCode!: string;

  @Column({ type: 'varchar', length: 20, enum: Chain })
  chain!: Chain;

  @Column({ type: 'varchar', length: 50 })
  symbol!: string;

  @Column({ name: 'contract_address', type: 'varchar', length: 255, nullable: true })
  contractAddress!: string | null;

  @Column({ type: 'int' })
  decimals!: number;

  @Column({ name: 'treasury_address', type: 'varchar', length: 255 })
  treasuryAddress!: string;

  @Column({ name: 'min_confirmations', type: 'int' })
  minConfirmations!: number;

  @Column({ name: 'min_amount', type: 'numeric', precision: 36, scale: 18 })
  minAmount!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
