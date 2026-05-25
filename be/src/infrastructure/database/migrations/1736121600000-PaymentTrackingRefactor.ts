import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentTrackingRefactor1736121600000 implements MigrationInterface {
  name = 'PaymentTrackingRefactor1736121600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        chain varchar(24) NOT NULL,
        asset varchar(12) NOT NULL,
        token_amount numeric(36,18) NOT NULL,
        token_price_usd numeric(36,18) NOT NULL,
        usd_amount numeric(36,18) NOT NULL,
        quote_currency varchar(8) NOT NULL DEFAULT 'USD',
        quote_price_usd numeric(36,18) NOT NULL,
        quoted_at timestamptz NOT NULL,
        quote_expires_at timestamptz NOT NULL,
        expected_amount_base_units numeric(78,0) NOT NULL,
        sender_address varchar(255),
        request_ip varchar(96),
        receiver_address varchar(255) NOT NULL,
        solana_reference varchar(255),
        eth_created_block_number varchar(64),
        btc_derivation_index int,
        btc_derivation_path varchar(128),
        status varchar(24) NOT NULL DEFAULT 'WAITING',
        expires_at timestamptz NOT NULL,
        last_checked_at timestamptz,
        last_check_result jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        intent_id uuid NOT NULL UNIQUE REFERENCES payment_intents(id) ON DELETE CASCADE,
        chain varchar(24) NOT NULL,
        asset varchar(12) NOT NULL,
        amount_base_units numeric(78,0) NOT NULL,
        sender_address varchar(255),
        receiver_address varchar(255) NOT NULL,
        tx_hash varchar(255),
        output_index int,
        status varchar(24) NOT NULL,
        block_number varchar(64),
        confirmations int NOT NULL DEFAULT 0,
        confirmed_at timestamptz,
        raw_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_intents_btc_receiver_unique"
      ON payment_intents (receiver_address)
      WHERE chain = 'BITCOIN'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_intents_btc_derivation_index_unique"
      ON payment_intents (btc_derivation_index)
      WHERE btc_derivation_index IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_intents_solana_reference_unique"
      ON payment_intents (solana_reference)
      WHERE solana_reference IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_intents_status_checked"
      ON payment_intents (status, last_checked_at)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_intents_sender_created"
      ON payment_intents (sender_address, created_at)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payments_intent_unique"
      ON payments (intent_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payments_chain_hash_receiver_unique"
      ON payments (chain, tx_hash, receiver_address)
      WHERE tx_hash IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payments_btc_output_unique"
      ON payments (chain, tx_hash, output_index)
      WHERE tx_hash IS NOT NULL AND output_index IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_sender_created"
      ON payments (sender_address, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_status_chain"
      ON payments (status, chain)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS payments');
    await queryRunner.query('DROP TABLE IF EXISTS payment_intents');
  }
}
