import { Injectable } from '@nestjs/common';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { addFixed } from '../../common/utils/decimal';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { DashboardSummaryDto } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getSummary(auth: AuthContext): Promise<DashboardSummaryDto> {
    const [profile, wallets, transactions] = await Promise.all([
      this.usersService.syncAndRequireActive(auth),
      this.walletsService.listForUser(auth.sub),
      this.transactionsService.listForUser(auth),
    ]);

    const activePurchaseIntentCount = transactions.items.filter((item) =>
      ['PENDING', 'MATCHED', 'CONFIRMING'].includes(item.status),
    ).length;
    const confirmedTransactions = transactions.items.filter((item) => item.status === 'CONFIRMED');
    const totalContributedAmount = confirmedTransactions.reduce(
      (sum, item) => addFixed(sum, item.amountPaid),
      '0',
    );
    const totalAllocatedTokens = confirmedTransactions.reduce(
      (sum, item) => addFixed(sum, item.tokensAllocated ?? '0'),
      '0',
    );
    const primaryWallet = wallets.find((wallet) => wallet.isPrimary) ?? wallets[0] ?? null;

    return {
      profile: {
        userId: auth.sub,
        email: auth.email,
        role: profile.role,
        status: profile.status,
      },
      walletSummary: {
        linkedWalletCount: wallets.length,
        primaryWallet: primaryWallet
          ? {
              id: primaryWallet.id,
              chain: primaryWallet.chain,
              address: primaryWallet.address,
              verifiedAt: primaryWallet.verifiedAt,
            }
          : null,
      },
      activePurchaseIntentCount,
      confirmedTransactionCount: confirmedTransactions.length,
      totalContributedAmount,
      totalAllocatedTokens,
      recentTransactions: transactions.items.slice(0, 5),
    };
  }
}
