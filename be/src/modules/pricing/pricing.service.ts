import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PricingItemDto } from './dto/pricing.dto';
import { AssetPriceEntity } from './entities/asset-price.entity';
import { SupportedAssetEntity } from './entities/supported-asset.entity';

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

    return {
      items: assets.map((asset) => {
        const price = priceMap.get(asset.id);
        return {
          assetCode: asset.assetCode,
          chain: asset.chain,
          priceUsd: price?.priceUsd ?? '0',
          updatedAt: price?.updatedAt ?? null,
        };
      }),
    };
  }

  async getSupportedAssetByCode(assetCode: string): Promise<SupportedAssetEntity | null> {
    return this.supportedAssetsRepository.findOne({ where: { assetCode, isActive: true } });
  }

  async getPriceByAssetId(assetId: string): Promise<AssetPriceEntity | null> {
    return this.assetPricesRepository.findOne({ where: { assetId } });
  }

  async listSupportedAssets(): Promise<SupportedAssetEntity[]> {
    return this.supportedAssetsRepository.find({
      where: { isActive: true },
      order: { assetCode: 'ASC' },
    });
  }
}
