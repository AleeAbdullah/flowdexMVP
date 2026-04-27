import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/domain.enums';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TransactionListItemDto } from '../transactions/dto/transactions.dto';
import { AdminTransactionFiltersDto } from './dto/admin.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(InternalJwtGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('transactions')
  listTransactions(
    @CurrentAuth() auth: AuthContext,
    @Query() filters: AdminTransactionFiltersDto,
  ): Promise<{ items: TransactionListItemDto[] }> {
    return this.adminService.listTransactions(auth, filters);
  }

  @Get('transactions/:id')
  getTransaction(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<TransactionListItemDto> {
    return this.adminService.getTransaction(auth, id);
  }

  @Post('transactions/:id/reconcile')
  reconcileTransaction(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ): Promise<TransactionListItemDto> {
    return this.adminService.reconcileTransaction(auth, id);
  }

  @Get('stats')
  getStats(
    @CurrentAuth() auth: AuthContext,
  ): Promise<{
    totalConfirmedVolume: string;
    totalTransactionCount: number;
    activeTransactionCount: number;
    confirmedTransactionCount: number;
    failedTransactionCount: number;
    lastTransactionAt: Date | null;
    transactionCountsByStatus: Record<string, number>;
  }> {
    return this.adminService.getStats(auth);
  }
}
