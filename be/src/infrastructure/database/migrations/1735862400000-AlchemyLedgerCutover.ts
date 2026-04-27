import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlchemyLedgerCutover1735862400000 implements MigrationInterface {
  name = 'AlchemyLedgerCutover1735862400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallets
      ADD COLUMN IF NOT EXISTS network varchar(40),
      ADD COLUMN IF NOT EXISTS provider varchar(40),
      ADD COLUMN IF NOT EXISTS alchemy_account_id varchar(255),
      ADD COLUMN IF NOT EXISTS alchemy_wallet_id varchar(255),
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallet_user_network_primary"
      ON wallets (user_id, network)
      WHERE is_primary = true AND network IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ledger_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        wallet_id uuid NOT NULL REFERENCES wallets(id),
        network varchar(40) NOT NULL,
        asset_code varchar(64) NOT NULL,
        amount numeric(36,18) NOT NULL,
        status varchar(32) NOT NULL,
        operation_id varchar(255),
        tx_hash varchar(255),
        failure_reason varchar(160),
        block_number varchar(64),
        block_time timestamptz,
        confirmed_at timestamptz,
        raw_track_payload jsonb,
        raw_webhook_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ledger_tx_user_created"
      ON ledger_transactions (user_id, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ledger_tx_wallet_network_hash"
      ON ledger_transactions (wallet_id, network, tx_hash)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ledger_tx_operation_id"
      ON ledger_transactions (operation_id)
      WHERE operation_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source varchar(80) NOT NULL,
        dedupe_key varchar(255) NOT NULL,
        status varchar(40) NOT NULL,
        signature varchar(255),
        processing_error text,
        raw_payload jsonb NOT NULL,
        processed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webhook_dedupe_key"
      ON webhook_deliveries (dedupe_key)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sync_checkpoints (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id uuid NOT NULL REFERENCES wallets(id),
        network varchar(40) NOT NULL,
        last_page_key varchar(255),
        last_synced_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sync_checkpoint_wallet_network"
      ON sync_checkpoints (wallet_id, network)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL UNIQUE,
        linked_wallet_count int NOT NULL DEFAULT 0,
        total_transaction_count int NOT NULL DEFAULT 0,
        confirmed_transaction_count int NOT NULL DEFAULT 0,
        pending_transaction_count int NOT NULL DEFAULT 0,
        total_volume numeric(36,18) NOT NULL DEFAULT 0,
        last_transaction_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS analytics_snapshots');
    await queryRunner.query('DROP TABLE IF EXISTS sync_checkpoints');
    await queryRunner.query('DROP TABLE IF EXISTS webhook_deliveries');
    await queryRunner.query('DROP TABLE IF EXISTS ledger_transactions');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_wallet_user_network_primary"');

    await queryRunner.query(`
      ALTER TABLE wallets
      DROP COLUMN IF EXISTS network,
      DROP COLUMN IF EXISTS provider,
      DROP COLUMN IF EXISTS alchemy_account_id,
      DROP COLUMN IF EXISTS alchemy_wallet_id,
      DROP COLUMN IF EXISTS updated_at
    `);
  }
}
