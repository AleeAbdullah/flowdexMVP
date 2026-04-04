import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/domain.enums';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TransactionListItemDto } from '../transactions/dto/transactions.dto';
import { AdminTransactionFiltersDto, AdminUnmatchedTransactionDto, CreateRefundDto } from './dto/admin.dto';
import { RefundEntity } from './entities/refund.entity';
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

  @Get('stats')
  getStats(
    @CurrentAuth() auth: AuthContext,
  ): Promise<{
    totalConfirmedVolumeReal: string;
    totalConfirmedVolumeDisplay: string;
    transactionCountsByStatus: Record<string, number>;
    unmatchedCount: number;
    refundCount: number;
    currentTier: number;
  }> {
    return this.adminService.getStats(auth);
  }

  @Get('reconciliation/unmatched')
  listUnmatched(
    @CurrentAuth() auth: AuthContext,
  ): Promise<{ items: AdminUnmatchedTransactionDto[] }> {
    return this.adminService.listUnmatched(auth);
  }

  @Post('refunds')
  createRefund(
    @CurrentAuth() auth: AuthContext,
    @Body() body: CreateRefundDto,
  ): Promise<{ refundId: string; status: string }> {
    return this.adminService.createRefund(
      auth,
      body.purchaseIntentId,
      body.refundAmount,
      body.destinationAddress,
      body.reason,
    );
  }

  @Get('refunds')
  listRefunds(@CurrentAuth() auth: AuthContext): Promise<{ items: RefundEntity[] }> {
    return this.adminService.listRefunds(auth);
  }
}
