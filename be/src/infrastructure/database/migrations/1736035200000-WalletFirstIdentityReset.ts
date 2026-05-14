import { MigrationInterface, QueryRunner } from 'typeorm';

export class WalletFirstIdentityReset1736035200000 implements MigrationInterface {
  name = 'WalletFirstIdentityReset1736035200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS simulation_intents');
    await queryRunner.query('DROP TABLE IF EXISTS ledger_transactions');

    await queryRunner.query(`
      CREATE TABLE ledger_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        owner_wallet_address_normalized varchar(64) NOT NULL,
        owner_wallet_address_checksum varchar(64) NOT NULL,
        chain_id int NOT NULL,
        network varchar(40) NOT NULL,
        asset_type varchar(16) NOT NULL,
        asset_code varchar(64) NOT NULL,
        asset_contract_address varchar(64),
        asset_decimals int NOT NULL,
        amount_base_units numeric(78,0) NOT NULL,
        amount_display varchar(128) NOT NULL,
        status varchar(32) NOT NULL,
        tx_hash varchar(255),
        expected_recipient_address varchar(64) NOT NULL,
        actual_from_address varchar(64),
        actual_to_address varchar(64),
        actual_amount_base_units numeric(78,0),
        failure_reason varchar(160),
        block_number varchar(64),
        confirmed_at timestamptz,
        simulation_id uuid,
        raw_track_payload jsonb,
        raw_webhook_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ledger_tx_public_id"
      ON ledger_transactions (public_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ledger_tx_chain_hash_unique"
      ON ledger_transactions (chain_id, tx_hash)
      WHERE tx_hash IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_tx_owner_chain"
      ON ledger_transactions (owner_wallet_address_normalized, chain_id)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_tx_owner_created"
      ON ledger_transactions (owner_wallet_address_normalized, created_at)
    `);

    await queryRunner.query(`
      CREATE TABLE simulation_intents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address_normalized varchar(64) NOT NULL,
        chain_id int NOT NULL,
        asset_type varchar(16) NOT NULL,
        asset_code varchar(64) NOT NULL,
        asset_contract_address varchar(64),
        asset_decimals int NOT NULL,
        amount_base_units numeric(78,0) NOT NULL,
        amount_display varchar(128) NOT NULL,
        expected_recipient_address varchar(64) NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'created',
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        request_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_simulation_intent_wallet_created"
      ON simulation_intents (wallet_address_normalized, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_simulation_intent_wallet_status"
      ON simulation_intents (wallet_address_normalized, status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS simulation_intents');
    await queryRunner.query('DROP TABLE IF EXISTS ledger_transactions');

    await queryRunner.query(`
      CREATE TABLE ledger_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        wallet_id uuid NOT NULL REFERENCES wallets(id),
        network varchar(40) NOT NULL,
        chain_id int,
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
      CREATE INDEX "IDX_ledger_tx_user_created"
      ON ledger_transactions (user_id, created_at)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ledger_tx_wallet_network_hash"
      ON ledger_transactions (wallet_id, network, tx_hash)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ledger_tx_chain_hash_unique"
      ON ledger_transactions (chain_id, tx_hash)
      WHERE tx_hash IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ledger_tx_operation_id"
      ON ledger_transactions (operation_id)
      WHERE operation_id IS NOT NULL
    `);
  }
}
