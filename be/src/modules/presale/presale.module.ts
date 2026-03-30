import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PricingModule } from '../pricing/pricing.module';
import { PresaleController } from './presale.controller';
import { PresaleStateEntity } from './entities/presale-state.entity';
import { PresaleTierEntity } from './entities/presale-tier.entity';
import { PresaleService } from './presale.service';

@Module({
  imports: [TypeOrmModule.forFeature([PresaleStateEntity, PresaleTierEntity]), PricingModule],
  controllers: [PresaleController],
  providers: [PresaleService],
  exports: [PresaleService],
})
export class PresaleModule {}
