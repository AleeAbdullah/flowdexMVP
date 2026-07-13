import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import {
  CreatePaymentIntentDto,
  PaymentCheckoutCapabilitiesDto,
  PaymentCheckoutSessionDto,
  PaymentHistoryQueryDto,
  PaymentLeadersQueryDto,
  PaymentLeadersResponseDto,
  PaymentIntentStatusDto,
  PaymentPortfolioResponseDto,
  PaymentPublicDto,
  PreparedWalletActionDto,
  PreparePaymentWalletActionDto,
  SubmitPaymentTxResultDto,
} from './dto/payments.dto';
import { PaymentsService } from './payments.service';

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('checkout-capabilities')
  getCheckoutCapabilities(): PaymentCheckoutCapabilitiesDto {
    return this.paymentsService.getCheckoutCapabilities();
  }

  @Post('intents')
  @Throttle({ intent: { limit: 5, ttl: 60_000 } })
  createIntent(
    @Body() body: CreatePaymentIntentDto,
    @Req() request: Request,
  ): Promise<PaymentCheckoutSessionDto> {
    return this.paymentsService.createIntent(body, request.ip);
  }

  @Get('intents/:intentId/status')
  @Throttle({ status: { limit: 30, ttl: 60_000 } })
  getIntentStatus(@Param('intentId') intentId: string): Promise<PaymentIntentStatusDto> {
    return this.paymentsService.getIntentStatus(intentId);
  }

  @Post('intents/:intentId/wallet-action')
  @Throttle({ walletAction: { limit: 10, ttl: 60_000 } })
  prepareWalletAction(
    @Param('intentId') intentId: string,
    @Headers('x-payment-checkout-token') checkoutToken: string | undefined,
    @Body() body: PreparePaymentWalletActionDto,
  ): Promise<PreparedWalletActionDto> {
    return this.paymentsService.prepareWalletAction(intentId, checkoutToken ?? '', body);
  }

  @Post('intents/:intentId/tx-result')
  @Throttle({ walletTxResult: { limit: 10, ttl: 60_000 } })
  submitWalletTxResult(
    @Param('intentId') intentId: string,
    @Headers('x-payment-checkout-token') checkoutToken: string | undefined,
    @Body() body: SubmitPaymentTxResultDto,
  ): Promise<PaymentIntentStatusDto> {
    return this.paymentsService.submitWalletTxResult(intentId, checkoutToken ?? '', body);
  }

  @Get('portfolio')
  @Throttle({ portfolio: { limit: 20, ttl: 60_000 } })
  getPortfolio(@Query() query: PaymentHistoryQueryDto): Promise<PaymentPortfolioResponseDto> {
    return this.paymentsService.getPublicPortfolio(query.walletAddress);
  }

  @Get()
  @Throttle({ history: { limit: 20, ttl: 60_000 } })
  getHistory(@Query() query: PaymentHistoryQueryDto): Promise<{ items: PaymentPublicDto[] }> {
    return this.paymentsService.listPublicHistory(query.walletAddress);
  }

  @Get('leaders')
  @Throttle({ leaders: { limit: 30, ttl: 60_000 } })
  getLeaders(@Query() query: PaymentLeadersQueryDto): Promise<PaymentLeadersResponseDto> {
    return this.paymentsService.listPublicLeaders(query.limit ?? 10);
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
