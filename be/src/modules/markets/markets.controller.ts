import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import {
  CryptoMarketsQueryDto,
  CryptoMarketsResponseDto,
} from './dto/markets.dto';
import { MarketsService } from './markets.service';

@ApiTags('markets')
@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get('crypto')
  getCryptoMarkets(@Query() query: CryptoMarketsQueryDto): Promise<CryptoMarketsResponseDto> {
    return this.marketsService.getCryptoMarkets(query);
  }

}
