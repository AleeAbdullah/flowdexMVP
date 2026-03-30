import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('asset_prices')
export class AssetPriceEntity {
  @PrimaryColumn({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'price_usd', type: 'numeric', precision: 36, scale: 18 })
  priceUsd!: string;

  @Column({ type: 'varchar', length: 50 })
  source!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
