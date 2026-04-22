import { ApiProperty } from '@nestjs/swagger';
import { TransactionListItemDto } from '../../transactions/dto/transactions.dto';

class DashboardPrimaryWalletDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  network!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ nullable: true })
  verifiedAt!: Date | null;
}

class DashboardProfileDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  status!: string;
}

class DashboardWalletSummaryDto {
  @ApiProperty()
  linkedWalletCount!: number;

  @ApiProperty({ nullable: true, type: DashboardPrimaryWalletDto })
  primaryWallet!: DashboardPrimaryWalletDto | null;
}

export class DashboardSummaryDto {
  @ApiProperty({ type: DashboardProfileDto })
  profile!: DashboardProfileDto;

  @ApiProperty({ type: DashboardWalletSummaryDto })
  walletSummary!: DashboardWalletSummaryDto;

  @ApiProperty()
  activeTransactionCount!: number;

  @ApiProperty()
  confirmedTransactionCount!: number;

  @ApiProperty()
  totalTrackedVolume!: string;

  @ApiProperty({ type: [TransactionListItemDto] })
  recentTransactions!: TransactionListItemDto[];
}
