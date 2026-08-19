import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogFeaturedImage1787097600000 implements MigrationInterface {
  name = 'BlogFeaturedImage1787097600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE blog_posts ADD COLUMN featured_image_url text');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE blog_posts DROP COLUMN featured_image_url');
  }
}
