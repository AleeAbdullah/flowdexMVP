import { Body, Controller, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AlchemyService } from '../alchemy/alchemy.service';
import { TransactionsService } from './transactions.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('webhooks')
@Controller('webhooks/alchemy')
export class AlchemyWebhooksController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly alchemyService: AlchemyService,
  ) {}

  @Post('address-activity')
  async ingestAddressActivity(
    @Req() request: RawBodyRequest,
    @Body() body: Record<string, unknown>,
    @Headers('x-alchemy-signature') signature: string | undefined,
  ): Promise<{ received: true; duplicate: boolean }> {
    const rawBody = (request.rawBody ?? Buffer.from(JSON.stringify(body))).toString('utf8');

    if (!signature || !this.alchemyService.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.transactionsService.ingestAddressActivityWebhook(body, signature);
  }
}
