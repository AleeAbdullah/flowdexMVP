import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blog_posts')
@Index('IDX_blog_posts_slug_unique', ['slug'], { unique: true })
export class BlogPostEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 190 })
  slug!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  summary!: string;

  @Column({ type: 'varchar', length: 60 })
  category!: string;

  @Column({ name: 'body_html', type: 'text' })
  bodyHtml!: string;

  @Column({ name: 'created_by_admin_id', type: 'varchar', length: 255 })
  createdByAdminId!: string;

  @CreateDateColumn({ name: 'published_at', type: 'timestamptz' })
  publishedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
