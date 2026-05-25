import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import {
  CreatePaymentIntentDto,
  PaymentHistoryQueryDto,
  PaymentIntentPublicDto,
  PaymentIntentStatusDto,
  PaymentPublicDto,
} from './dto/payments.dto';
import { PaymentsService } from './payments.service';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intents')
  @Throttle({ intent: { limit: 5, ttl: 60_000 } })
  createIntent(
    @Body() body: CreatePaymentIntentDto,
    @Req() request: Request,
  ): Promise<PaymentIntentPublicDto> {
    return this.paymentsService.createIntent(body, request.ip);
  }

  @Get('intents/:intentId/status')
  @Throttle({ status: { limit: 30, ttl: 60_000 } })
  getIntentStatus(@Param('intentId') intentId: string): Promise<PaymentIntentStatusDto> {
    return this.paymentsService.getIntentStatus(intentId);
  }

  @Get()
  @Throttle({ history: { limit: 20, ttl: 60_000 } })
  getHistory(@Query() query: PaymentHistoryQueryDto): Promise<{ items: PaymentPublicDto[] }> {
    return this.paymentsService.listPublicHistory(query.walletAddress);
  }

  @Post('webhooks/alchemy/ethereum')
  processAlchemyEthereumWebhook(
    @Body() body: unknown,
    @Req() request: RawBodyRequest,
  ): Promise<{ received: true; processed: number }> {
    return this.paymentsService.processEthereumAlchemyWebhook({
      rawBody: request.rawBody?.toString('utf8') ?? JSON.stringify(body),
      signature: request.header('x-alchemy-signature') ?? '',
      payload: body,
    });
  }
}
