import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Chain, WalletProvider } from '../../../common/enums/domain.enums';

@Entity('wallet_challenges')
@Index('IDX_wallet_challenge_user_created', ['userId', 'createdAt'])
export class WalletChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 20, enum: Chain, nullable: true })
  chain!: Chain | null;

  @Column({ name: 'address_raw', type: 'varchar', length: 255, nullable: true })
  addressRaw!: string | null;

  @Column({ type: 'varchar', length: 40, enum: WalletProvider, nullable: true })
  provider!: WalletProvider | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  network!: string | null;

  @Column({ name: 'chain_id', type: 'int', nullable: true })
  chainId!: number | null;

  @Column({ name: 'address_normalized', type: 'varchar', length: 255 })
  addressNormalized!: string;

  @Column({ type: 'varchar', length: 255 })
  nonce!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
