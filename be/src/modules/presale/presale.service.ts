import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PricingService } from '../pricing/pricing.service';
import { PresaleTierDto } from './dto/presale.dto';
import { PresaleStateEntity } from './entities/presale-state.entity';
import { PresaleTierEntity } from './entities/presale-tier.entity';

@Injectable()
export class PresaleService {
  constructor(
    @InjectRepository(PresaleStateEntity)
    private readonly presaleStateRepository: Repository<PresaleStateEntity>,
    @InjectRepository(PresaleTierEntity)
    private readonly presaleTiersRepository: Repository<PresaleTierEntity>,
    private readonly pricingService: PricingService,
  ) {}

  async getState(): Promise<PresaleStateEntity> {
    const states = await this.presaleStateRepository.find({
      take: 1,
      order: { updatedAt: 'DESC' },
    });
    if (states.length === 0) {
      throw new NotFoundException('Presale state not configured');
    }

    return states[0];
  }

  async getCurrentTier(): Promise<PresaleTierEntity> {
    const state = await this.getState();
    const tier = await this.presaleTiersRepository.findOne({
      where: { id: state.currentTierId },
    });

    if (!tier) {
      throw new NotFoundException('Current presale tier not configured');
    }

    return tier;
  }

  async getStats(): Promise<{
    fundsRaisedRealUsd: string;
    fundsRaisedDisplayUsd: string;
    tokensSoldReal: string;
    tokensSoldDisplay: string;
    currentTier: number;
    currentTokenPriceUsd: string;
    displayMultiplier: number;
    updatedAt: Date;
  }> {
    const [state, tier] = await Promise.all([this.getState(), this.getCurrentTier()]);
    const multiplier = Number(state.displayMultiplier);

    return {
      fundsRaisedRealUsd: state.totalRaisedUsdReal,
      fundsRaisedDisplayUsd: (Number(state.totalRaisedUsdReal) * multiplier).toString(),
      tokensSoldReal: state.totalTokensSoldReal,
      tokensSoldDisplay: (Number(state.totalTokensSoldReal) * multiplier).toString(),
      currentTier: tier.sortOrder,
      currentTokenPriceUsd: tier.tokenPriceUsd,
      displayMultiplier: multiplier,
      updatedAt: state.updatedAt,
    };
  }

  async getTiers(): Promise<{ items: PresaleTierDto[] }> {
    const tiers = await this.presaleTiersRepository.find({
      order: { sortOrder: 'ASC' },
    });

    return {
      items: tiers.map((tier) => ({
        id: tier.id,
        order: tier.sortOrder,
        tokenPriceUsd: tier.tokenPriceUsd,
        tokenCapReal: tier.tokenCapReal,
        isActive: tier.isActive,
      })),
    };
  }

  async getConfig(): Promise<{
    supportedAssets: Array<{
      assetCode: string;
      chain: string;
      minConfirmations: number;
      minAmount: string;
    }>;
    minConfirmationsByAsset: Record<string, number>;
    displayMultiplier: number;
  }> {
    const [state, assets] = await Promise.all([
      this.getState(),
      this.pricingService.listSupportedAssets(),
    ]);

    return {
      supportedAssets: assets.map((asset) => ({
        assetCode: asset.assetCode,
        chain: asset.chain,
        minConfirmations: asset.minConfirmations,
        minAmount: asset.minAmount,
      })),
      minConfirmationsByAsset: Object.fromEntries(
        assets.map((asset) => [asset.assetCode, asset.minConfirmations]),
      ),
      displayMultiplier: state.displayMultiplier,
    };
  }
}
