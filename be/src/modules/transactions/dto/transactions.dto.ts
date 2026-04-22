import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SimulateTransactionDto {
  @ApiProperty()
  @IsUUID()
  walletId!: string;

  @ApiProperty()
  @IsString()
  network!: string;

  @ApiProperty()
  @IsString()
  to!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  data?: string;
}

export class TrackTransactionDto {
  @ApiProperty()
  @IsUUID()
  walletId!: string;

  @ApiProperty()
  @IsString()
  network!: string;

  @ApiProperty()
  @IsString()
  assetCode!: string;

  @ApiProperty()
  @IsString()
  amount!: string;

  @ApiProperty()
  @IsString()
  simulationId!: string;

  @ApiProperty()
  @IsString()
  to!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  operationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  txHash?: string;
}

export class TransactionListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  walletId!: string;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  network!: string;

  @ApiProperty()
  assetCode!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  operationId!: string | null;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty({ nullable: true })
  blockNumber!: string | null;

  @ApiProperty({ nullable: true })
  blockTime!: Date | null;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
