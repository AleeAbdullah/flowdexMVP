import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { PresaleTierDto } from './dto/presale.dto';
import { PresaleService } from './presale.service';

@ApiTags('presale')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('presale')
export class PresaleController {
  constructor(private readonly presaleService: PresaleService) {}

  @Get('stats')
  getStats(): Promise<{
    fundsRaisedRealUsd: string;
    fundsRaisedDisplayUsd: string;
    tokensSoldReal: string;
    tokensSoldDisplay: string;
    currentTier: number;
    currentTokenPriceUsd: string;
    displayMultiplier: number;
    updatedAt: Date;
  }> {
    return this.presaleService.getStats();
  }

  @Get('tiers')
  getTiers(): Promise<{ items: PresaleTierDto[] }> {
    return this.presaleService.getTiers();
  }

  @Get('config')
  getConfig(): Promise<{
    supportedAssets: Array<{
      assetCode: string;
      chain: string;
      minConfirmations: number;
      minAmount: string;
    }>;
    minConfirmationsByAsset: Record<string, number>;
    displayMultiplier: number;
  }> {
    return this.presaleService.getConfig();
  }
}
