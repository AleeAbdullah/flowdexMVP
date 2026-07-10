import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminCredentialUniqueIndex1783728000000 implements MigrationInterface {
  name = 'AdminCredentialUniqueIndex1783728000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_auth_accounts_provider_account"
      ON auth_accounts (provider, provider_account_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_auth_accounts_provider_account"');
  }
}
