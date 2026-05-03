import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class CryptoMarketsQueryDto {
  @ApiProperty({ required: false, example: 'usd' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  @Matches(/^[a-z0-9]{2,12}$/)
  quote?: string;

  @ApiProperty({ required: false, example: 25, minimum: 6, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(100)
  limit?: number;
}

export class CryptoMarketAssetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  symbol!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  imageUrl!: string | null;

  @ApiProperty()
  rank!: number;

  @ApiProperty()
  quoteCurrency!: string;

  @ApiProperty()
  currentPrice!: string;

  @ApiProperty({ nullable: true })
  marketCap!: string | null;

  @ApiProperty({ nullable: true })
  totalVolume!: string | null;

  @ApiProperty({ nullable: true })
  priceChangePercentage24h!: string | null;

  @ApiProperty({ nullable: true })
  lastUpdated!: string | null;
}

export class CryptoMarketsResponseDto {
  @ApiProperty({ type: [CryptoMarketAssetDto] })
  items!: CryptoMarketAssetDto[];

  @ApiProperty()
  quoteCurrency!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  servedAt!: string;

  @ApiProperty({ enum: ['fresh', 'cached', 'stale'] })
  cacheStatus!: 'fresh' | 'cached' | 'stale';
}

export class CryptoQuoteCurrenciesResponseDto {
  @ApiProperty({ type: [String] })
  items!: string[];

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  servedAt!: string;

  @ApiProperty({ enum: ['fresh', 'cached', 'stale'] })
  cacheStatus!: 'fresh' | 'cached' | 'stale';
}
