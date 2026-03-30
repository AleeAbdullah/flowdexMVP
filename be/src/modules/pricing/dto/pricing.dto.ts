import { ApiProperty } from '@nestjs/swagger';

import { Chain } from '../../../common/enums/domain.enums';

export class PricingItemDto {
  @ApiProperty()
  assetCode!: string;

  @ApiProperty({ enum: Chain })
  chain!: Chain;

  @ApiProperty()
  priceUsd!: string;

  @ApiProperty()
  updatedAt!: Date | null;
}
