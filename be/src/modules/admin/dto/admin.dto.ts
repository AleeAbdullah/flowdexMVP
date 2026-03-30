import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty()
  @IsUUID()
  purchaseIntentId!: string;

  @ApiProperty()
  @IsString()
  refundAmount!: string;

  @ApiProperty()
  @IsString()
  destinationAddress!: string;

  @ApiProperty()
  @IsString()
  reason!: string;
}

export class AdminTransactionFiltersDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  chain?: string;

  @IsOptional()
  @IsString()
  assetCode?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
