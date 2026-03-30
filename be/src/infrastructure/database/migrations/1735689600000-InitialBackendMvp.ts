import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialBackendMvp1735689600000 implements MigrationInterface {
  name = 'InitialBackendMvp1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id varchar(255) PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        email_verified boolean NOT NULL DEFAULT false,
        name varchar(255),
        image text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id varchar(255) PRIMARY KEY,
        user_id varchar(255) NOT NULL,
        token text NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        provider varchar(100) NOT NULL,
        provider_account_id varchar(255) NOT NULL,
        password_hash text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS auth_verifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier varchar(255) NOT NULL,
        value text NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id varchar(255) PRIMARY KEY,
        role varchar(20) NOT NULL DEFAULT 'USER',
        status varchar(20) NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        chain varchar(20) NOT NULL,
        address_raw varchar(255) NOT NULL,
        address_normalized varchar(255) NOT NULL,
        is_primary boolean NOT NULL DEFAULT false,
        verified_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallets_chain_address"
      ON wallets (chain, address_normalized)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallet_primary_per_user_chain"
      ON wallets (user_id, chain)
      WHERE is_primary = true
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wallet_challenges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        chain varchar(20) NOT NULL,
        address_raw varchar(255) NOT NULL,
        address_normalized varchar(255) NOT NULL,
        message text NOT NULL,
        nonce varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS supported_assets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_code varchar(50) NOT NULL UNIQUE,
        chain varchar(20) NOT NULL,
        symbol varchar(50) NOT NULL,
        contract_address varchar(255),
        decimals int NOT NULL,
        treasury_address varchar(255) NOT NULL,
        min_confirmations int NOT NULL,
        min_amount numeric(36,18) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supported_assets_chain_symbol_contract"
      ON supported_assets (chain, symbol, COALESCE(contract_address, ''))
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_prices (
        asset_id uuid PRIMARY KEY REFERENCES supported_assets(id) ON DELETE CASCADE,
        price_usd numeric(36,18) NOT NULL,
        source varchar(50) NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS presale_tiers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sort_order int NOT NULL UNIQUE,
        token_price_usd numeric(36,18) NOT NULL,
        token_cap_real numeric(36,18) NOT NULL,
        starts_at timestamptz,
        ends_at timestamptz,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS presale_state (
        id uuid PRIMARY KEY,
        current_tier_id uuid NOT NULL REFERENCES presale_tiers(id),
        total_raised_usd_real numeric(36,18) NOT NULL DEFAULT 0,
        total_tokens_sold_real numeric(36,18) NOT NULL DEFAULT 0,
        display_multiplier int NOT NULL DEFAULT 10,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS purchase_intents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        wallet_id uuid NOT NULL REFERENCES wallets(id),
        asset_id uuid NOT NULL REFERENCES supported_assets(id),
        payment_address varchar(255) NOT NULL,
        expected_amount numeric(36,18) NOT NULL,
        quoted_asset_price_usd numeric(36,18) NOT NULL,
        quoted_token_price_usd numeric(36,18) NOT NULL,
        expected_tokens_real numeric(36,18) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'PENDING',
        expires_at timestamptz NOT NULL,
        reported_tx_hash varchar(255),
        matched_blockchain_tx_id uuid,
        confirmed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS blockchain_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        chain varchar(20) NOT NULL,
        asset_id uuid NOT NULL REFERENCES supported_assets(id),
        tx_hash varchar(255) NOT NULL,
        transfer_index int NOT NULL,
        from_address varchar(255) NOT NULL,
        to_address varchar(255) NOT NULL,
        amount numeric(36,18) NOT NULL,
        block_number bigint NOT NULL,
        block_time timestamptz NOT NULL,
        confirmations int NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'DETECTED',
        matched_intent_id uuid,
        raw_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_blockchain_transactions_dedupe"
      ON blockchain_transactions (chain, tx_hash, transfer_index)
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS token_allocations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar(255) NOT NULL,
        purchase_intent_id uuid NOT NULL UNIQUE REFERENCES purchase_intents(id),
        tier_id uuid NOT NULL REFERENCES presale_tiers(id),
        tokens_real numeric(36,18) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_intent_id uuid NOT NULL UNIQUE REFERENCES purchase_intents(id),
        approved_by_user_id varchar(255) NOT NULL,
        asset_id uuid NOT NULL REFERENCES supported_assets(id),
        refund_amount numeric(36,18) NOT NULL,
        destination_address varchar(255) NOT NULL,
        outbound_tx_hash varchar(255),
        status varchar(20) NOT NULL DEFAULT 'APPROVED',
        reason text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        processed_at timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id varchar(255) NOT NULL,
        action varchar(100) NOT NULL,
        target_type varchar(100) NOT NULL,
        target_id varchar(255),
        payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS admin_audit_logs');
    await queryRunner.query('DROP TABLE IF EXISTS refunds');
    await queryRunner.query('DROP TABLE IF EXISTS token_allocations');
    await queryRunner.query('DROP TABLE IF EXISTS blockchain_transactions');
    await queryRunner.query('DROP TABLE IF EXISTS purchase_intents');
    await queryRunner.query('DROP TABLE IF EXISTS presale_state');
    await queryRunner.query('DROP TABLE IF EXISTS presale_tiers');
    await queryRunner.query('DROP TABLE IF EXISTS asset_prices');
    await queryRunner.query('DROP TABLE IF EXISTS supported_assets');
    await queryRunner.query('DROP TABLE IF EXISTS wallet_challenges');
    await queryRunner.query('DROP TABLE IF EXISTS wallets');
    await queryRunner.query('DROP TABLE IF EXISTS user_profiles');
    await queryRunner.query('DROP TABLE IF EXISTS auth_verifications');
    await queryRunner.query('DROP TABLE IF EXISTS auth_accounts');
    await queryRunner.query('DROP TABLE IF EXISTS auth_sessions');
    await queryRunner.query('DROP TABLE IF EXISTS auth_users');
  }
}
