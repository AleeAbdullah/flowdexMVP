import type { PaymentIntentEntity } from '../entities/payment-intent.entity';
import type {
  PaymentChain,
  PaymentWalletTxIdKind,
} from '../payments.types';
import type {
  PreparePaymentWalletActionDto,
  PreparedWalletActionDto,
} from '../dto/payments.dto';

export type WalletActionPrepareInput = {
  intent: PaymentIntentEntity;
  senderAddress: string;
  dto: PreparePaymentWalletActionDto;
};

export interface WalletActionExecutor {
  readonly chain: PaymentChain;
  prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto>;
  assertTxId(txIdKind: PaymentWalletTxIdKind, txId: string): void;
}
