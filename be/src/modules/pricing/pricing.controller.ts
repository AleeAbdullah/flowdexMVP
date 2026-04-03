import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PricingItemDto } from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  getPricing(): Promise<{ items: PricingItemDto[] }> {
    return this.pricingService.list();
  }
}
