import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { multiplyFixed, normalizeFixed, parseFixed } from '../../../common/utils/decimal';
import { MarketsService } from '../../markets/markets.service';
import { PAYMENT_ASSET_DECIMALS, PaymentAsset } from '../payments.types';

type PresalePrice = {
  tokenPriceUsd: string;
};

type CachedQuote = {
  priceUsd: string;
  quotedAt: Date;
  expiresAt: Date;
};

const QUOTE_TTL_MS = 60_000;
const INTENT_QUOTE_TTL_MS = 5 * 60_000;

@Injectable()
export class PaymentPricingService {
  private readonly quoteCache = new Map<PaymentAsset, CachedQuote>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly marketsService: MarketsService,
  ) {}

  async quotePurchase(input: { asset: PaymentAsset; tokenAmount: string }): Promise<{
    tokenAmount: string;
    tokenPriceUsd: string;
    usdAmount: string;
    quoteCurrency: 'USD';
    quotePriceUsd: string;
    quotedAt: Date;
    quoteExpiresAt: Date;
    expectedAmountBaseUnits: string;
  }> {
    const tokenAmount = normalizeFixed(input.tokenAmount);
    if (parseFixed(tokenAmount) <= 0n) {
      throw new BadRequestException('Invalid token amount');
    }

    const presale = await this.getActivePresalePrice();
    const quote = await this.getFreshAssetQuote(input.asset);
    const usdAmount = normalizeFixed(multiplyFixed(tokenAmount, presale.tokenPriceUsd));
    const expectedAmountBaseUnits = this.usdToAssetBaseUnits({
      usdAmount,
      priceUsd: quote.priceUsd,
      decimals: PAYMENT_ASSET_DECIMALS[input.asset],
    });

    return {
      tokenAmount,
      tokenPriceUsd: presale.tokenPriceUsd,
      usdAmount,
      quoteCurrency: 'USD',
      quotePriceUsd: quote.priceUsd,
      quotedAt: quote.quotedAt,
      quoteExpiresAt: new Date(Date.now() + INTENT_QUOTE_TTL_MS),
      expectedAmountBaseUnits,
    };
  }

  private async getActivePresalePrice(): Promise<PresalePrice> {
    const rows = await this.dataSource.query(`
      SELECT t.token_price_usd AS "tokenPriceUsd"
      FROM presale_state s
      JOIN presale_tiers t ON t.id = s.current_tier_id
      ORDER BY s.updated_at DESC
      LIMIT 1
    `) as Array<{ tokenPriceUsd: string }>;

    if (rows[0]?.tokenPriceUsd) {
      return { tokenPriceUsd: normalizeFixed(rows[0].tokenPriceUsd) };
    }

    const fallbackRows = await this.dataSource.query(`
      SELECT token_price_usd AS "tokenPriceUsd"
      FROM presale_tiers
      WHERE is_active = true
      ORDER BY sort_order ASC
      LIMIT 1
    `) as Array<{ tokenPriceUsd: string }>;

    if (!fallbackRows[0]?.tokenPriceUsd) {
      throw new ServiceUnavailableException('PRESALE_PRICE_UNAVAILABLE');
    }

    return { tokenPriceUsd: normalizeFixed(fallbackRows[0].tokenPriceUsd) };
  }

  private async getFreshAssetQuote(asset: PaymentAsset): Promise<CachedQuote> {
    if (asset === PaymentAsset.USDT_TRC20) {
      return {
        priceUsd: '1',
        quotedAt: new Date(),
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
      };
    }

    const cached = this.quoteCache.get(asset);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }

    const priceUsd = await this.marketsService.getCryptoSpotPriceUsd(asset);
    if (!priceUsd || parseFixed(priceUsd) <= 0n) {
      throw new ServiceUnavailableException('PRICE_UNAVAILABLE');
    }

    const quote: CachedQuote = {
      priceUsd: normalizeFixed(priceUsd),
      quotedAt: new Date(),
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS),
    };
    this.quoteCache.set(asset, quote);
    return quote;
  }

  private usdToAssetBaseUnits(input: { usdAmount: string; priceUsd: string; decimals: number }): string {
    const usdScaled = parseFixed(input.usdAmount);
    const priceScaled = parseFixed(input.priceUsd);
    const assetUnits = (usdScaled * (10n ** BigInt(input.decimals))) / priceScaled;
    return assetUnits.toString();
  }
}
