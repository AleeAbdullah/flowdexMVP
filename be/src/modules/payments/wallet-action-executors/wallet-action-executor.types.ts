import type { EntityManager } from 'typeorm';

import type { AuthContext } from '../../../common/decorators/current-auth.decorator';
import type { PaymentIntentEntity } from '../entities/payment-intent.entity';
import type { PaymentWalletActionEntity } from '../entities/payment-wallet-action.entity';
import type {
  PaymentChain,
  PaymentIntentStatus,
  PaymentStatus,
} from '../payments.types';
import type {
  PreparePaymentWalletActionDto,
  PreparedWalletActionDto,
  SubmitPaymentTxResultDto,
} from '../dto/payments.dto';
import type { PaymentEntity } from '../entities/payment.entity';

export type WalletSessionContext = {
  normalized: string;
  checksum: string;
  chain: PaymentChain;
};

export type WalletActionPrepareInput = {
  intent: PaymentIntentEntity;
  senderAddress: string;
  wallet: WalletSessionContext;
  dto: PreparePaymentWalletActionDto;
};

export type WalletActionSubmitInput = {
  intent: PaymentIntentEntity;
  action: PaymentWalletActionEntity;
  wallet: WalletSessionContext;
  dto: SubmitPaymentTxResultDto;
  manager: EntityManager;
};

export type WalletActionSubmitResult = {
  intent: PaymentIntentEntity;
  payment: PaymentEntity;
  nextPaymentStatus: PaymentStatus;
  nextIntentStatus: PaymentIntentStatus;
};

export interface WalletActionExecutor {
  readonly chain: PaymentChain;
  prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto>;
  submitTxResult(input: WalletActionSubmitInput): Promise<WalletActionSubmitResult>;
}

export type WalletActionAuthContext = AuthContext;
