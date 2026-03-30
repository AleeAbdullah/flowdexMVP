import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreatePurchaseIntentDto {
  @ApiProperty()
  @IsUUID()
  walletId!: string;

  @ApiProperty()
  @IsString()
  assetCode!: string;

  @ApiProperty()
  @IsString()
  paymentAmount!: string;
}

export class ReportTransactionDto {
  @ApiProperty()
  @IsString()
  txHash!: string;
}
