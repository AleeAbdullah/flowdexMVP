import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('presale_tiers')
export class PresaleTierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sort_order', type: 'int', unique: true })
  sortOrder!: number;

  @Column({ name: 'token_price_usd', type: 'numeric', precision: 36, scale: 18 })
  tokenPriceUsd!: string;

  @Column({ name: 'token_cap_real', type: 'numeric', precision: 36, scale: 18 })
  tokenCapReal!: string;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt!: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
