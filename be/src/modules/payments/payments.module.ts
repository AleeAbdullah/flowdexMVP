import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from '../alchemy/alchemy.module';
import { MarketsModule } from '../markets/markets.module';
import { PaymentIntentEntity } from './entities/payment-intent.entity';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentWalletActionEntity } from './entities/payment-wallet-action.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsScanner } from './payments.scanner';
import { PaymentsService } from './payments.service';
import { BtcAddressService } from './services/btc-address.service';
import { EvmPaymentExecutionService } from './services/evm-payment-execution.service';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PaymentStateService } from './services/payment-state.service';
import { SolanaPaymentExecutionService } from './services/solana-payment-execution.service';

@Module({
  imports: [
    AlchemyModule,
    MarketsModule,
    TypeOrmModule.forFeature([PaymentIntentEntity, PaymentEntity, PaymentWalletActionEntity]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsScanner,
    BtcAddressService,
    EvmPaymentExecutionService,
    PaymentPricingService,
    PaymentStateService,
    SolanaPaymentExecutionService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
