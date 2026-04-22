import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const SUPPORTED_NETWORKS = ['ETH_SEPOLIA', 'BASE_SEPOLIA'] as const;

export class LinkWalletDto {
  @ApiProperty({ enum: SUPPORTED_NETWORKS })
  @IsIn(SUPPORTED_NETWORKS)
  network!: (typeof SUPPORTED_NETWORKS)[number];

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  alchemyAccountId!: string;

  @ApiProperty()
  @IsString()
  alchemyWalletId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class WalletDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ enum: SUPPORTED_NETWORKS })
  network!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  alchemyAccountId!: string;

  @ApiProperty()
  alchemyWalletId!: string;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty({ nullable: true })
  verifiedAt!: Date | null;
}
