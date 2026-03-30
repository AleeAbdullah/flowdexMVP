import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('presale_state')
export class PresaleStateEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'current_tier_id', type: 'uuid' })
  currentTierId!: string;

  @Column({ name: 'total_raised_usd_real', type: 'numeric', precision: 36, scale: 18, default: 0 })
  totalRaisedUsdReal!: string;

  @Column({ name: 'total_tokens_sold_real', type: 'numeric', precision: 36, scale: 18, default: 0 })
  totalTokensSoldReal!: string;

  @Column({ name: 'display_multiplier', type: 'int', default: 10 })
  displayMultiplier!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
