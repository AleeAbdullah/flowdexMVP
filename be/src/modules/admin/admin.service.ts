import { Injectable } from '@nestjs/common';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { AdminPaymentFiltersDto } from '../payments/dto/admin-payments.dto';
import { PaymentPublicDto } from '../payments/dto/payments.dto';
import { PaymentsService } from '../payments/payments.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
  ) {}

  async listPayments(
    auth: AuthContext,
    filters: AdminPaymentFiltersDto,
  ): Promise<{ items: Array<PaymentPublicDto & {
    rawPayload: Record<string, unknown> | null;
    tokenAmount: string;
    usdAmount: string;
  }> }> {
    await this.usersService.syncAndRequireActive(auth);
    return this.paymentsService.listAdminPayments(filters);
  }

  async getStats(auth: AuthContext): Promise<{
    totalPaymentCount: number;
    confirmedPaymentCount: number;
    pendingPaymentCount: number;
    failedPaymentCount: number;
    totalConfirmedUsd: string;
    latestPaymentAt: Date | null;
    countsByStatus: Record<string, number>;
    volumeByChain: Record<string, string>;
  }> {
    await this.usersService.syncAndRequireActive(auth);
    return this.paymentsService.getAdminStats();
  }
}
