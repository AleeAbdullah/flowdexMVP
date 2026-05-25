import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from '../alchemy/alchemy.module';
import { MarketsModule } from '../markets/markets.module';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsScanner } from './payments.scanner';
import { PaymentsService } from './payments.service';
import { BtcAddressService } from './services/btc-address.service';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PaymentStateService } from './services/payment-state.service';

@Module({
  imports: [
    AlchemyModule,
    MarketsModule,
    TypeOrmModule.forFeature([PaymentIntentEntity, PaymentEntity]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsScanner,
    BtcAddressService,
    PaymentPricingService,
    PaymentStateService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
