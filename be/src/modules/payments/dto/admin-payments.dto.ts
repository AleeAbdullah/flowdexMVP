import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaymentAsset, PaymentChain, PaymentIntentStatus } from '../payments.types';

export class AdminPaymentFiltersDto {
  @IsOptional()
  @IsEnum(PaymentChain)
  chain?: PaymentChain;

  @IsOptional()
  @IsEnum(PaymentAsset)
  asset?: PaymentAsset;

  @IsOptional()
  @IsEnum(PaymentIntentStatus)
  status?: PaymentIntentStatus;

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
