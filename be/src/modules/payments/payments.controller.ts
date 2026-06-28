import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import {
  CreatePaymentIntentDto,
  PaymentHistoryQueryDto,
  PaymentIntentPublicDto,
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

  @Post('intents/:intentId/wallet-action')
  @ApiBearerAuth()
  @UseGuards(InternalJwtGuard)
  @Throttle({ walletAction: { limit: 10, ttl: 60_000 } })
  prepareWalletAction(
    @CurrentAuth() auth: AuthContext,
    @Param('intentId') intentId: string,
    @Body() body: PreparePaymentWalletActionDto,
  ): Promise<PreparedWalletActionDto> {
    return this.paymentsService.prepareWalletAction(auth, intentId, body);
  }

  @Post('intents/:intentId/tx-result')
  @ApiBearerAuth()
  @UseGuards(InternalJwtGuard)
  @Throttle({ walletTxResult: { limit: 10, ttl: 60_000 } })
  submitWalletTxResult(
    @CurrentAuth() auth: AuthContext,
    @Param('intentId') intentId: string,
    @Body() body: SubmitPaymentTxResultDto,
  ): Promise<PaymentIntentStatusDto> {
    return this.paymentsService.submitWalletTxResult(auth, intentId, body);
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
