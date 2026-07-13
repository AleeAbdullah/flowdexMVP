import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletCheckoutCapabilityAndBitcoinActions1783900800000 implements MigrationInterface {
  name = 'WalletCheckoutCapabilityAndBitcoinActions1783900800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payment_intents
      ADD COLUMN IF NOT EXISTS checkout_token_hash varchar(64)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_wallet_actions_btc_tx_unique"
      ON payment_wallet_actions (tx_id_kind, tx_id)
      WHERE tx_id_kind = 'btc_tx_hash' AND tx_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_wallet_actions_btc_tx_unique"');
    await queryRunner.query(`
      ALTER TABLE payment_intents
      DROP COLUMN IF EXISTS checkout_token_hash
    `);
  }
}
