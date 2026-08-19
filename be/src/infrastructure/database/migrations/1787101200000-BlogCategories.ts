import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogCategories1787101200000 implements MigrationInterface {
  name = 'BlogCategories1787101200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE blog_categories (
        name varchar(60) PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      INSERT INTO blog_categories (name, created_at, updated_at)
      SELECT btrim(category), min(created_at), max(updated_at)
      FROM blog_posts
      WHERE btrim(category) <> ''
      GROUP BY btrim(category)
      ON CONFLICT (name) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS blog_categories');
  }
}
