import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { env } from '../../infrastructure/config/env';
import { normalizeFixed } from '../../common/utils/decimal';
import { PricingItemDto } from './dto/pricing.dto';
import { AssetPriceEntity } from './entities/asset-price.entity';
import { SupportedAssetEntity } from './entities/supported-asset.entity';

const PHASE_TWO_ACTIVE_ASSET_CODES = new Set(['ETH', 'USDT_ERC20']);

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(SupportedAssetEntity)
    private readonly supportedAssetsRepository: Repository<SupportedAssetEntity>,
    @InjectRepository(AssetPriceEntity)
    private readonly assetPricesRepository: Repository<AssetPriceEntity>,
  ) {}

  async list(): Promise<{ items: PricingItemDto[] }> {
    const [assets, prices] = await Promise.all([
      this.supportedAssetsRepository.find({
        where: { isActive: true },
        order: { assetCode: 'ASC' },
      }),
      this.assetPricesRepository.find(),
    ]);

    const priceMap = new Map(prices.map((price) => [price.assetId, price]));
    const phaseTwoAssets = assets.filter((asset) => PHASE_TWO_ACTIVE_ASSET_CODES.has(asset.assetCode));

    return {
      items: phaseTwoAssets.map((asset) => {
        const price = priceMap.get(asset.id);
        return {
          assetCode: asset.assetCode,
          chain: asset.chain,
          priceUsd: price ? normalizeFixed(price.priceUsd) : '0',
          updatedAt: price?.updatedAt ?? null,
        };
      }),
    };
  }

  async getSupportedAssetByCode(assetCode: string): Promise<SupportedAssetEntity | null> {
    if (!PHASE_TWO_ACTIVE_ASSET_CODES.has(assetCode)) {
      return null;
    }

    return this.supportedAssetsRepository.findOne({ where: { assetCode, isActive: true } });
  }

  async getPriceByAssetId(assetId: string): Promise<AssetPriceEntity | null> {
    return this.assetPricesRepository.findOne({ where: { assetId } });
  }

  async listSupportedAssets(): Promise<SupportedAssetEntity[]> {
    const assets = await this.supportedAssetsRepository.find({
      where: { isActive: true },
      order: { assetCode: 'ASC' },
    });

    return assets.filter((asset) => PHASE_TWO_ACTIVE_ASSET_CODES.has(asset.assetCode));
  }

  isPriceFresh(price: AssetPriceEntity | null, now = new Date()): boolean {
    if (!price?.updatedAt) {
      return false;
    }

    const ageMs = now.getTime() - price.updatedAt.getTime();
    return ageMs <= env.assetPriceMaxAgeSeconds * 1000;
  }
}
