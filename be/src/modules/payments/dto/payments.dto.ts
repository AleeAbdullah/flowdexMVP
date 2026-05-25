import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

import { PaymentAsset, PaymentChain, PaymentIntentStatus, PaymentStatus } from '../payments.types';

export class CreatePaymentIntentDto {
  @ApiProperty({ enum: PaymentChain })
  @IsEnum(PaymentChain)
  chain!: PaymentChain;

  @ApiProperty({ enum: PaymentAsset })
  @IsEnum(PaymentAsset)
  asset!: PaymentAsset;

  @ApiProperty({ example: '1000' })
  @IsString()
  @Matches(/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/)
  tokenAmount!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  senderAddress?: string;
}

export class PaymentHistoryQueryDto {
  @ApiProperty()
  @IsString()
  walletAddress!: string;
}

export class PaymentInstructionsDto {
  @ApiProperty()
  chain!: PaymentChain;

  @ApiProperty()
  asset!: PaymentAsset;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty()
  expectedAmountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  paymentUri!: string | null;

  @ApiProperty({ nullable: true })
  solanaReference!: string | null;
}

export class PaymentIntentPublicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chain!: PaymentChain;

  @ApiProperty()
  asset!: PaymentAsset;

  @ApiProperty()
  tokenAmount!: string;

  @ApiProperty()
  usdAmount!: string;

  @ApiProperty()
  expectedAmountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  senderAddress!: string | null;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty()
  status!: PaymentIntentStatus;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ nullable: true })
  lastCheckedAt!: Date | null;

  @ApiProperty()
  instructions!: PaymentInstructionsDto;
}

export class PaymentPublicDto {
  @ApiProperty()
  intentId!: string;

  @ApiProperty()
  chain!: PaymentChain;

  @ApiProperty()
  asset!: PaymentAsset;

  @ApiProperty()
  amountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  senderAddress!: string | null;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty()
  status!: PaymentStatus;

  @ApiProperty({ nullable: true })
  blockNumber!: string | null;

  @ApiProperty()
  confirmations!: number;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaymentIntentStatusDto {
  @ApiProperty()
  intent!: PaymentIntentPublicDto;

  @ApiProperty({ nullable: true })
  payment!: PaymentPublicDto | null;
}
