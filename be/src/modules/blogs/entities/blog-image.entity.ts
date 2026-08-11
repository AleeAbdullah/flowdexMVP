import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BlogPostEntity } from './blog-post.entity';

@Entity('blog_images')
export class BlogImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bytea' })
  data!: Buffer;

  @Column({ name: 'mime_type', type: 'varchar', length: 20 })
  mimeType!: string;

  @Column({ name: 'byte_size', type: 'integer' })
  byteSize!: number;

  @Column({ name: 'created_by_admin_id', type: 'varchar', length: 255 })
  createdByAdminId!: string;

  @Column({ name: 'blog_post_id', type: 'uuid', nullable: true })
  blogPostId!: string | null;

  @ManyToOne(() => BlogPostEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_post_id' })
  blogPost!: BlogPostEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
