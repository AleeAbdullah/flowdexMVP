import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { SimulateTransactionDto, TrackTransactionDto, TransactionListItemDto } from './dto/transactions.dto';
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
  ): Promise<{ allowed: boolean; reason: string | null; simulationId: string | null }> {
    return this.transactionsService.simulate(auth, body);
  }

  @Post('track')
  track(
    @CurrentAuth() auth: AuthContext,
    @Body() body: TrackTransactionDto,
  ): Promise<{ transactionId: string; status: string }> {
    return this.transactionsService.track(auth, body);
  }

  @Get()
  list(@CurrentAuth() auth: AuthContext): Promise<{ items: TransactionListItemDto[] }> {
    return this.transactionsService.listForUser(auth);
  }

  @Get(':id')
  getById(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<TransactionListItemDto> {
    return this.transactionsService.getForUser(auth, id);
  }
}
