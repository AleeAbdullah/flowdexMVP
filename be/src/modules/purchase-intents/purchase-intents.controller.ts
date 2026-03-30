import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import {
  CreatePurchaseIntentDto,
  ReportTransactionDto,
} from './dto/purchase-intents.dto';
import { PurchaseIntentsService } from './purchase-intents.service';

@ApiTags('purchase-intents')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('purchase-intents')
export class PurchaseIntentsController {
  constructor(private readonly purchaseIntentsService: PurchaseIntentsService) {}

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @Body() body: CreatePurchaseIntentDto,
  ): Promise<{
    intentId: string;
    paymentAddress: string;
    assetCode: string;
    paymentAmount: string;
    assetUsdPrice: string;
    tokenPriceUsd: string;
    tokensAllocatedPreview: string;
    expiresAt: Date;
    currentTier: number;
  }> {
    return this.purchaseIntentsService.create(
      auth,
      body.walletId,
      body.assetCode,
      body.paymentAmount,
    );
  }

  @Post(':id/report-tx')
  reportTx(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() body: ReportTransactionDto,
  ): Promise<{ accepted: true }> {
    return this.purchaseIntentsService.reportTx(auth, id, body.txHash);
  }
}
