import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import {
  SimulateTransactionDto,
  TrackTransactionDto,
  WalletTransactionListItemDto,
  WalletTransactionSimulationDto,
  WalletTransactionTrackResultDto,
} from './dto/transactions.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('simulate')
  simulate(
    @CurrentAuth() auth: AuthContext,
    @Body() body: SimulateTransactionDto,
  ): Promise<WalletTransactionSimulationDto> {
    return this.transactionsService.simulate(auth, body);
  }

  @Post('track')
  track(
    @CurrentAuth() auth: AuthContext,
    @Body() body: TrackTransactionDto,
  ): Promise<WalletTransactionTrackResultDto> {
    return this.transactionsService.track(auth, body);
  }

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<{ items: WalletTransactionListItemDto[] }> {
    return this.transactionsService.listForWallet(auth);
  }

  @Get(':id')
  getById(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<WalletTransactionListItemDto> {
    return this.transactionsService.getForWallet(auth, id);
  }
}
