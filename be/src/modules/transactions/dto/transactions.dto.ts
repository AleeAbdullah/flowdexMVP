import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class SimulateTransactionDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  chainId!: number;

  @ApiProperty({ enum: ['native', 'erc20'] })
  @IsIn(['native', 'erc20'])
  assetType!: 'native' | 'erc20';

  @ApiProperty()
  @IsString()
  assetCode!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  assetContractAddress?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(36)
  assetDecimals!: number;

  @ApiProperty()
  @IsString()
  @Matches(/^[0-9]+$/)
  amountBaseUnits!: string;

  @ApiProperty()
  @IsString()
  amountDisplay!: string;
}

export class TrackTransactionDto {
  @ApiProperty()
  @IsUUID()
  simulationId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  txHash?: string;
}

export class WalletTransactionRequestDto {
  @ApiProperty()
  to!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  data!: string;
}

export class WalletTransactionSimulationDto {
  @ApiProperty()
  allowed!: boolean;

  @ApiProperty({ nullable: true })
  reason!: string | null;

  @ApiProperty({ nullable: true })
  simulationId!: string | null;

  @ApiProperty({ nullable: true, type: WalletTransactionRequestDto })
  request!: WalletTransactionRequestDto | null;
}

export class WalletTransactionTrackResultDto {
  @ApiProperty()
  publicId!: string;

  @ApiProperty()
  status!: string;
}

export class WalletTransactionListItemDto {
  @ApiProperty()
  publicId!: string;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  walletAddressChecksum!: string;

  @ApiProperty()
  network!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  assetType!: 'native' | 'erc20';

  @ApiProperty()
  assetCode!: string;

  @ApiProperty()
  assetContractAddress!: string | null;

  @ApiProperty()
  assetDecimals!: number;

  @ApiProperty()
  amountBaseUnits!: string;

  @ApiProperty()
  amountDisplay!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty()
  expectedRecipientAddress!: string;

  @ApiProperty({ nullable: true })
  actualFromAddress!: string | null;

  @ApiProperty({ nullable: true })
  actualToAddress!: string | null;

  @ApiProperty({ nullable: true })
  actualAmountBaseUnits!: string | null;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty({ nullable: true })
  blockNumber!: string | null;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AdminTransactionListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  publicId!: string;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  walletAddressChecksum!: string;

  @ApiProperty()
  network!: string;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  assetType!: 'native' | 'erc20';

  @ApiProperty()
  assetCode!: string;

  @ApiProperty()
  assetContractAddress!: string | null;

  @ApiProperty()
  assetDecimals!: number;

  @ApiProperty()
  amountBaseUnits!: string;

  @ApiProperty()
  amountDisplay!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty()
  expectedRecipientAddress!: string;

  @ApiProperty({ nullable: true })
  actualFromAddress!: string | null;

  @ApiProperty({ nullable: true })
  actualToAddress!: string | null;

  @ApiProperty({ nullable: true })
  actualAmountBaseUnits!: string | null;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty({ nullable: true })
  blockNumber!: string | null;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty({ nullable: true })
  simulationId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
