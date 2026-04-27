import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import { WalletProvider, WalletTrustLevel } from '../../../common/enums/domain.enums';

const SUPPORTED_NETWORKS = ['ETH_SEPOLIA', 'BASE_SEPOLIA'] as const;
const SUPPORTED_PROVIDERS = [WalletProvider.ALCHEMY_EMBEDDED, WalletProvider.METAMASK] as const;

export class CreateWalletChallengeDto {
  @ApiProperty({ enum: SUPPORTED_PROVIDERS, example: WalletProvider.METAMASK })
  @IsIn(SUPPORTED_PROVIDERS)
  provider!: WalletProvider;

  @ApiProperty({ enum: SUPPORTED_NETWORKS })
  @IsIn(SUPPORTED_NETWORKS)
  network!: (typeof SUPPORTED_NETWORKS)[number];

  @ApiProperty({ example: 84532 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  chainId!: number;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty({ required: false, description: 'Frontend origin (for challenge message context)' })
  @IsOptional()
  @IsString()
  origin?: string;
}

export class WalletChallengeDto {
  @ApiProperty()
  challengeId!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  expiresAt!: Date;
}

export class LinkWalletDto {
  @ApiProperty({ enum: SUPPORTED_PROVIDERS, required: false })
  @IsOptional()
  @IsIn(SUPPORTED_PROVIDERS)
  provider?: WalletProvider;

  @ApiProperty({ enum: SUPPORTED_NETWORKS })
  @IsIn(SUPPORTED_NETWORKS)
  network!: (typeof SUPPORTED_NETWORKS)[number];

  @ApiProperty({ example: 84532 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  chainId!: number;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alchemyAccountId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alchemyWalletId?: string;

  @ApiProperty({ required: false, description: 'MetaMask challenge identifier' })
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiProperty({ required: false, description: 'MetaMask signature for challenge message' })
  @IsOptional()
  @IsString()
  signature?: string;
}

export class WalletDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty({ enum: SUPPORTED_NETWORKS })
  network!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  provider!: string;

  @ApiProperty({ enum: WalletTrustLevel })
  trustLevel!: WalletTrustLevel;

  @ApiProperty()
  alchemyAccountId!: string;

  @ApiProperty()
  alchemyWalletId!: string;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty({ nullable: true })
  verifiedAt!: Date | null;
}
