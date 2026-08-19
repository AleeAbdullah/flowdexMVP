import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogAuthorBio1787104800000 implements MigrationInterface {
  name = 'BlogAuthorBio1787104800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE blog_posts
      ADD COLUMN author_name varchar(100) NOT NULL DEFAULT 'FlowDex Team'
    `);
    await queryRunner.query(`
      ALTER TABLE blog_posts
      ADD COLUMN author_bio varchar(500) NOT NULL
      DEFAULT 'Product, research, security, and community updates from the team building FlowDex.'
    `);
    await queryRunner.query('ALTER TABLE blog_posts ALTER COLUMN author_name DROP DEFAULT');
    await queryRunner.query('ALTER TABLE blog_posts ALTER COLUMN author_bio DROP DEFAULT');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE blog_posts DROP COLUMN author_bio');
    await queryRunner.query('ALTER TABLE blog_posts DROP COLUMN author_name');
  }
}
