import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogImages1786492800000 implements MigrationInterface {
  name = 'BlogImages1786492800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE blog_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        data bytea NOT NULL,
        mime_type varchar(20) NOT NULL,
        byte_size integer NOT NULL,
        created_by_admin_id varchar(255) NOT NULL,
        blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_blog_images_blog_post_id" ON blog_images (blog_post_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS blog_images');
  }
}
