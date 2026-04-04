import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { TransactionListItemDto } from './dto/transactions.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(InternalJwtGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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
