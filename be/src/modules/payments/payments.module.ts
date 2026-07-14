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
import { AlchemySolanaProvider } from './services/alchemy-solana-provider.service';
import { PaymentPricingService } from './services/payment-pricing.service';
import { PaymentCheckoutCapabilityService } from './services/payment-checkout-capability.service';
import { PaymentBuyConfigService } from './services/payment-buy-config.service';
import { PaymentStateService } from './services/payment-state.service';
import { SolanaPaymentExecutionService } from './services/solana-payment-execution.service';
import { TronPaymentExecutionService } from './services/tron-payment-execution.service';
import { EthereumWalletActionExecutor } from './wallet-action-executors/ethereum-wallet-action.executor';
import { BitcoinWalletActionExecutor } from './wallet-action-executors/bitcoin-wallet-action.executor';
import { SolanaWalletActionExecutor } from './wallet-action-executors/solana-wallet-action.executor';
import { TronWalletActionExecutor } from './wallet-action-executors/tron-wallet-action.executor';
import { WalletActionExecutorRegistry } from './wallet-action-executors/wallet-action-executor.registry';

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
    AlchemySolanaProvider,
    PaymentPricingService,
    PaymentBuyConfigService,
    PaymentCheckoutCapabilityService,
    PaymentStateService,
    SolanaPaymentExecutionService,
    TronPaymentExecutionService,
    EthereumWalletActionExecutor,
    SolanaWalletActionExecutor,
    BitcoinWalletActionExecutor,
    TronWalletActionExecutor,
    WalletActionExecutorRegistry,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
