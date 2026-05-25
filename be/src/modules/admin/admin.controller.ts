import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthContext, CurrentAuth } from '../../common/decorators/current-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/domain.enums';
import { InternalJwtGuard } from '../../common/guards/internal-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminPaymentFiltersDto } from '../payments/dto/admin-payments.dto';
import { PaymentPublicDto } from '../payments/dto/payments.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(InternalJwtGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('payments')
  listPayments(
    @CurrentAuth() auth: AuthContext,
    @Query() filters: AdminPaymentFiltersDto,
  ): Promise<{ items: Array<PaymentPublicDto & {
    rawPayload: Record<string, unknown> | null;
    tokenAmount: string;
    usdAmount: string;
  }> }> {
    return this.adminService.listPayments(auth, filters);
  }

  @Get('stats')
  getStats(
    @CurrentAuth() auth: AuthContext,
  ): Promise<{
    totalPaymentCount: number;
    confirmedPaymentCount: number;
    pendingPaymentCount: number;
    failedPaymentCount: number;
    totalConfirmedUsd: string;
    latestPaymentAt: Date | null;
    countsByStatus: Record<string, number>;
    volumeByChain: Record<string, string>;
  }> {
    return this.adminService.getStats(auth);
  }
}
