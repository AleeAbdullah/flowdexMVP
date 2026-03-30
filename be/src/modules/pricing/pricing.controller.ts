import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { PricingItemDto } from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  getPricing(): Promise<{ items: PricingItemDto[] }> {
    return this.pricingService.list();
  }
}
