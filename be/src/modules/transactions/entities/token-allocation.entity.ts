import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('token_allocations')
@Index(['purchaseIntentId'], { unique: true })
export class TokenAllocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  @Column({ name: 'purchase_intent_id', type: 'uuid' })
  purchaseIntentId!: string;

  @Column({ name: 'tier_id', type: 'uuid' })
  tierId!: string;

  @Column({ name: 'tokens_real', type: 'numeric', precision: 36, scale: 18 })
  tokensReal!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
