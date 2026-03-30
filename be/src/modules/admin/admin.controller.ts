import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/domain.enums';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BlockchainTransactionEntity } from '../blockchain/entities/blockchain-transaction.entity';
import { TransactionListItemDto } from '../transactions/dto/transactions.dto';
import { AdminTransactionFiltersDto, CreateRefundDto } from './dto/admin.dto';
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
    @Query() filters: AdminTransactionFiltersDto,
  ): Promise<{ items: TransactionListItemDto[] }> {
    return this.adminService.listTransactions(filters);
  }

  @Get('transactions/:id')
  getTransaction(@Param('id') id: string): Promise<TransactionListItemDto> {
    return this.adminService.getTransaction(id);
  }

  @Get('stats')
  getStats(): Promise<{
    totalConfirmedVolumeReal: string;
    totalConfirmedVolumeDisplay: string;
    transactionCountsByStatus: Record<string, number>;
    unmatchedCount: number;
    refundCount: number;
    currentTier: number;
  }> {
    return this.adminService.getStats();
  }

  @Get('reconciliation/unmatched')
  listUnmatched(): Promise<{ items: BlockchainTransactionEntity[] }> {
    return this.adminService.listUnmatched();
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
  listRefunds(): Promise<{ items: RefundEntity[] }> {
    return this.adminService.listRefunds();
  }
}
