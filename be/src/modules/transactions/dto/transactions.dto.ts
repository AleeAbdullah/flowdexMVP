import { ApiProperty } from '@nestjs/swagger';

export class TransactionListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  chain!: string;

  @ApiProperty()
  assetCode!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty()
  amountPaid!: string;

  @ApiProperty({ nullable: true })
  tokensAllocated!: string | null;

  @ApiProperty()
  confirmations!: number;

  @ApiProperty({ nullable: true })
  blockTime!: Date | null;

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
