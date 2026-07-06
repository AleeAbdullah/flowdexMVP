import { MigrationInterface, QueryRunner } from 'typeorm';

export class TronPaymentSupport1783296000000 implements MigrationInterface {
  name = 'TronPaymentSupport1783296000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payment_intents
      ADD COLUMN IF NOT EXISTS tron_created_block_number varchar(64)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payment_intents
      DROP COLUMN IF EXISTS tron_created_block_number
    `);
  }
}
