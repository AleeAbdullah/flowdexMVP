import { MigrationInterface, QueryRunner } from 'typeorm';

const TIER_ONE_ID = '00000000-0000-0000-0000-000000000101';
const PRESALE_STATE_ID = '00000000-0000-0000-0000-000000000001';

export class SeedPresaleDefaults1781827200000 implements MigrationInterface {
  name = 'SeedPresaleDefaults1781827200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO presale_tiers (
        id,
        sort_order,
        token_price_usd,
        token_cap_real,
        is_active
      )
      VALUES (
        $1,
        1,
        0.001,
        2251875000,
        true
      )
      ON CONFLICT (sort_order) DO NOTHING
    `, [TIER_ONE_ID]);

    await queryRunner.query(`
      UPDATE presale_tiers
      SET is_active = true
      WHERE sort_order = 1
        AND NOT EXISTS (
          SELECT 1
          FROM presale_tiers
          WHERE is_active = true
        )
    `);

    await queryRunner.query(`
      INSERT INTO presale_state (
        id,
        current_tier_id,
        total_raised_usd_real,
        total_tokens_sold_real,
        display_multiplier
      )
      SELECT
        $1,
        id,
        0,
        0,
        10
      FROM presale_tiers
      WHERE is_active = true
      ORDER BY sort_order ASC
      LIMIT 1
      ON CONFLICT (id) DO NOTHING
    `, [PRESALE_STATE_ID]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM presale_state
      WHERE id = $1
        AND current_tier_id = $2
        AND total_raised_usd_real = 0
        AND total_tokens_sold_real = 0
    `, [PRESALE_STATE_ID, TIER_ONE_ID]);

    await queryRunner.query(`
      DELETE FROM presale_tiers
      WHERE id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM presale_state
          WHERE current_tier_id = $1
        )
    `, [TIER_ONE_ID]);
  }
}
