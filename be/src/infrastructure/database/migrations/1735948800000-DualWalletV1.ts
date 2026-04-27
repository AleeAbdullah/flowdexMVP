import { MigrationInterface, QueryRunner } from 'typeorm';

export class DualWalletV11735948800000 implements MigrationInterface {
  name = 'DualWalletV11735948800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE wallets
      ADD COLUMN IF NOT EXISTS chain_id int,
      ADD COLUMN IF NOT EXISTS trust_level varchar(40)
    `);

    await queryRunner.query(`
      UPDATE wallets
      SET chain_id = CASE
        WHEN network = 'BASE_SEPOLIA' THEN 84532
        WHEN network = 'ETH_SEPOLIA' THEN 11155111
        WHEN chain = 'BASE_SEPOLIA' THEN 84532
        ELSE 11155111
      END
      WHERE chain_id IS NULL
    `);

    await queryRunner.query(`
      UPDATE wallets
      SET address_normalized = lower(address_normalized),
          address_raw = lower(address_raw)
      WHERE address_normalized <> lower(address_normalized)
         OR address_raw <> lower(address_raw)
    `);

    await queryRunner.query(`
      UPDATE wallets
      SET provider = COALESCE(provider, 'ALCHEMY_EMBEDDED'),
          trust_level = COALESCE(trust_level, 'PROVIDER_ASSERTED')
    `);

    await queryRunner.query(`ALTER TABLE wallets ALTER COLUMN chain_id SET NOT NULL`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallets_chain_address"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallet_chain_id_address"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallet_chain_id_address"
      ON wallets (chain_id, address_normalized)
    `);

    await queryRunner.query(`
      ALTER TABLE wallet_challenges
      ADD COLUMN IF NOT EXISTS provider varchar(40),
      ADD COLUMN IF NOT EXISTS network varchar(40),
      ADD COLUMN IF NOT EXISTS chain_id int,
      ADD COLUMN IF NOT EXISTS issued_at timestamptz
    `);

    await queryRunner.query(`
      UPDATE wallet_challenges
      SET provider = COALESCE(provider, 'METAMASK'),
          network = COALESCE(network,
            CASE WHEN chain = 'BASE_SEPOLIA' THEN 'BASE_SEPOLIA' ELSE 'ETH_SEPOLIA' END
          ),
          chain_id = COALESCE(chain_id,
            CASE WHEN chain = 'BASE_SEPOLIA' THEN 84532 ELSE 11155111 END
          ),
          issued_at = COALESCE(issued_at, created_at),
          address_normalized = lower(address_normalized),
          address_raw = lower(address_raw)
    `);

    await queryRunner.query(`
      ALTER TABLE ledger_transactions
      ADD COLUMN IF NOT EXISTS chain_id int
    `);

    await queryRunner.query(`
      UPDATE ledger_transactions
      SET chain_id = CASE
        WHEN network = 'BASE_SEPOLIA' THEN 84532
        ELSE 11155111
      END
      WHERE chain_id IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ledger_tx_chain_hash_unique"
      ON ledger_transactions (chain_id, tx_hash)
      WHERE tx_hash IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ledger_tx_chain_hash_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wallet_chain_id_address"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_wallets_chain_address"
      ON wallets (chain, address_normalized)
    `);

    await queryRunner.query(`
      ALTER TABLE ledger_transactions
      DROP COLUMN IF EXISTS chain_id
    `);

    await queryRunner.query(`
      ALTER TABLE wallet_challenges
      DROP COLUMN IF EXISTS provider,
      DROP COLUMN IF EXISTS network,
      DROP COLUMN IF EXISTS chain_id,
      DROP COLUMN IF EXISTS issued_at
    `);

    await queryRunner.query(`
      ALTER TABLE wallets
      DROP COLUMN IF EXISTS chain_id,
      DROP COLUMN IF EXISTS trust_level
    `);
  }
}
