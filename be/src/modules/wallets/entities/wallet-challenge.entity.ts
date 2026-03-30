import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Chain } from '../../../common/enums/domain.enums';

@Entity('wallet_challenges')
export class WalletChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 20, enum: Chain })
  chain!: Chain;

  @Column({ name: 'address_raw', type: 'varchar', length: 255 })
  addressRaw!: string;

  @Column({ name: 'address_normalized', type: 'varchar', length: 255 })
  addressNormalized!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 255 })
  nonce!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
