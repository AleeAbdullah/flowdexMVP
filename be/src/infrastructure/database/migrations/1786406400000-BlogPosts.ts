import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPosts1786406400000 implements MigrationInterface {
  name = 'BlogPosts1786406400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE blog_posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(190) NOT NULL,
        title varchar(160) NOT NULL,
        summary varchar(500) NOT NULL,
        category varchar(60) NOT NULL,
        body_html text NOT NULL,
        created_by_admin_id varchar(255) NOT NULL,
        published_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_blog_posts_slug_unique" ON blog_posts (slug)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS blog_posts');
  }
}
