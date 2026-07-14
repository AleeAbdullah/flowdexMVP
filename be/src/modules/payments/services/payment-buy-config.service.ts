import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { normalizeFixed } from '../../../common/utils/decimal';
import {
  PaymentBuyConfigDto,
  PaymentCheckoutCapabilityDto,
} from '../dto/payments.dto';
import { PaymentPricingService } from './payment-pricing.service';

type PresaleBuyConfigRow = {
  currentTier: number | string;
  tokenPriceUsd: string;
  nextTierTokenPriceUsd: string | null;
  fundsRaisedUsd: string;
  tokensSold: string;
  currentTierTokenCap: string;
  aggregateTokenCap: string;
  targetRaisedUsd: string;
  updatedAt: Date | string;
};

@Injectable()
export class PaymentBuyConfigService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pricingService: PaymentPricingService,
  ) {}

  async getBuyConfig(capabilities: PaymentCheckoutCapabilityDto[]): Promise<PaymentBuyConfigDto> {
    const rows = await this.dataSource.query(`
      SELECT
        current_tier.sort_order AS "currentTier",
        current_tier.token_price_usd AS "tokenPriceUsd",
        (
          SELECT next_tier.token_price_usd
          FROM presale_tiers next_tier
          WHERE next_tier.sort_order > current_tier.sort_order
          ORDER BY next_tier.sort_order ASC
          LIMIT 1
        ) AS "nextTierTokenPriceUsd",
        state.total_raised_usd_real AS "fundsRaisedUsd",
        state.total_tokens_sold_real AS "tokensSold",
        current_tier.token_cap_real AS "currentTierTokenCap",
        totals.aggregate_token_cap AS "aggregateTokenCap",
        totals.target_raised_usd AS "targetRaisedUsd",
        state.updated_at AS "updatedAt"
      FROM presale_state state
      JOIN presale_tiers current_tier ON current_tier.id = state.current_tier_id
      CROSS JOIN (
        SELECT
          COALESCE(SUM(token_cap_real), 0) AS aggregate_token_cap,
          COALESCE(SUM(token_cap_real * token_price_usd), 0) AS target_raised_usd
        FROM presale_tiers
      ) totals
      ORDER BY state.updated_at DESC
      LIMIT 1
    `) as PresaleBuyConfigRow[];
    const row = rows[0];
    if (!row?.tokenPriceUsd) {
      throw new ServiceUnavailableException('PRESALE_CONFIG_UNAVAILABLE');
    }

    const enabledCapabilities = capabilities.filter(capability => capability.enabled);
    const assets = await Promise.all(enabledCapabilities.map(async capability => {
      const quote = await this.pricingService.getAssetQuote(capability.asset);
      return {
        ...capability,
        priceUsd: normalizeFixed(quote.priceUsd),
        quotedAt: quote.quotedAt.toISOString(),
        cacheStatus: quote.cacheStatus,
      };
    }));

    return {
      presale: {
        currentTier: Number(row.currentTier),
        tokenPriceUsd: normalizeFixed(row.tokenPriceUsd),
        nextTierTokenPriceUsd: row.nextTierTokenPriceUsd
          ? normalizeFixed(row.nextTierTokenPriceUsd)
          : null,
        fundsRaisedUsd: normalizeFixed(row.fundsRaisedUsd),
        tokensSold: normalizeFixed(row.tokensSold),
        currentTierTokenCap: normalizeFixed(row.currentTierTokenCap),
        aggregateTokenCap: normalizeFixed(row.aggregateTokenCap),
        targetRaisedUsd: normalizeFixed(row.targetRaisedUsd),
        updatedAt: new Date(row.updatedAt).toISOString(),
      },
      assets,
      servedAt: new Date().toISOString(),
    };
  }
}
