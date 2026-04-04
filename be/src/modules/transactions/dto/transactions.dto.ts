import { ApiProperty } from '@nestjs/swagger';

export class TransactionListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  walletId!: string;

  @ApiProperty({ nullable: true })
  walletAddress!: string | null;

  @ApiProperty()
  chain!: string;

  @ApiProperty()
  assetCode!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty({ nullable: true })
  reportedTxHash!: string | null;

  @ApiProperty({ nullable: true })
  matchedTxHash!: string | null;

  @ApiProperty()
  amountPaid!: string;

  @ApiProperty({ nullable: true })
  tokensAllocated!: string | null;

  @ApiProperty({ nullable: true })
  verificationFailureReason!: string | null;

  @ApiProperty()
  refundEligible!: boolean;

  @ApiProperty()
  confirmations!: number;

  @ApiProperty({ nullable: true })
  blockTime!: Date | null;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty({ nullable: true })
  refund!: {
    id: string;
    status: string;
    refundAmount: string;
    outboundTxHash: string | null;
  } | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
