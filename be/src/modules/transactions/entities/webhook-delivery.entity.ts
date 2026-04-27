import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('webhook_deliveries')
@Index('IDX_webhook_dedupe_key', ['dedupeKey'], { unique: true })
export class WebhookDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  source!: string;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 255 })
  dedupeKey!: string;

  @Column({ type: 'varchar', length: 40 })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signature!: string | null;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError!: string | null;

  @Column({ name: 'raw_payload', type: 'jsonb' })
  rawPayload!: Record<string, unknown>;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
