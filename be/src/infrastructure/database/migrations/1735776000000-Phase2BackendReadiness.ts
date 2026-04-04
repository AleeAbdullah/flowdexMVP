import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2BackendReadiness1735776000000 implements MigrationInterface {
  name = 'Phase2BackendReadiness1735776000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE purchase_intents
      ADD COLUMN IF NOT EXISTS failure_reason varchar(120)
    `);

    await queryRunner.query(`
      ALTER TABLE blockchain_transactions
      ADD COLUMN IF NOT EXISTS reconciliation_reason varchar(120)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE blockchain_transactions
      DROP COLUMN IF EXISTS reconciliation_reason
    `);

    await queryRunner.query(`
      ALTER TABLE purchase_intents
      DROP COLUMN IF EXISTS failure_reason
    `);
  }
}
