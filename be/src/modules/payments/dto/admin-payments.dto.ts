import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaymentAsset, PaymentChain, PaymentStatus } from '../payments.types';

export class AdminPaymentFiltersDto {
  @IsOptional()
  @IsEnum(PaymentChain)
  chain?: PaymentChain;

  @IsOptional()
  @IsEnum(PaymentAsset)
  asset?: PaymentAsset;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  senderAddress?: string;

  @IsOptional()
  @IsString()
  receiverAddress?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
