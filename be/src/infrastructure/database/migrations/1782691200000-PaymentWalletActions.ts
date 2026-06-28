import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentWalletActions1782691200000 implements MigrationInterface {
  name = 'PaymentWalletActions1782691200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_wallet_actions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_intent_id uuid NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
        chain varchar(24) NOT NULL,
        action_kind varchar(32) NOT NULL,
        sender_address varchar(255) NOT NULL,
        wallet_chain_id varchar(64),
        status varchar(24) NOT NULL DEFAULT 'PREPARED',
        request_json jsonb NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        tx_id varchar(255),
        tx_id_kind varchar(32),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_wallet_actions_intent_status"
      ON payment_wallet_actions (payment_intent_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_wallet_actions_sender_created"
      ON payment_wallet_actions (sender_address, created_at)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_wallet_actions_evm_tx_unique"
      ON payment_wallet_actions (tx_id_kind, tx_id)
      WHERE tx_id_kind = 'evm_tx_hash' AND tx_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_wallet_actions_solana_signature_unique"
      ON payment_wallet_actions (tx_id_kind, tx_id)
      WHERE tx_id_kind = 'solana_signature' AND tx_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS payment_wallet_actions');
  }
}
