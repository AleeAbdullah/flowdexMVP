import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';

import { Chain } from '../../../common/enums/domain.enums';

export class CreateWalletChallengeDto {
  @ApiProperty({ enum: Chain })
  @IsEnum(Chain)
  chain!: Chain;

  @ApiProperty()
  @IsString()
  address!: string;
}

export class VerifyWalletSignatureDto {
  @ApiProperty()
  @IsUUID()
  challengeId!: string;

  @ApiProperty()
  @IsString()
  signature!: string;
}

export class WalletDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: Chain })
  chain!: Chain;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty({ nullable: true })
  verifiedAt!: Date | null;
}
