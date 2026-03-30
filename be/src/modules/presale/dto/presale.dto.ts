import { ApiProperty } from '@nestjs/swagger';

export class PresaleTierDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  tokenPriceUsd!: string;

  @ApiProperty()
  tokenCapReal!: string;

  @ApiProperty()
  isActive!: boolean;
}
