import { BadRequestException, Injectable } from '@nestjs/common';

import { PaymentIntentStatus, PaymentStatus } from '../payments.types';

const ALLOWED_INTENT_TRANSITIONS: Record<PaymentIntentStatus, PaymentIntentStatus[]> = {
  [PaymentIntentStatus.WAITING]: [
    PaymentIntentStatus.DETECTED,
    PaymentIntentStatus.CONFIRMING,
    PaymentIntentStatus.CONFIRMED,
    PaymentIntentStatus.UNDERPAID,
    PaymentIntentStatus.OVERPAID,
    PaymentIntentStatus.EXPIRED,
    PaymentIntentStatus.FAILED,
    PaymentIntentStatus.LATE_PAID,
  ],
  [PaymentIntentStatus.DETECTED]: [
    PaymentIntentStatus.CONFIRMING,
    PaymentIntentStatus.CONFIRMED,
    PaymentIntentStatus.FAILED,
  ],
  [PaymentIntentStatus.CONFIRMING]: [
    PaymentIntentStatus.CONFIRMED,
    PaymentIntentStatus.FAILED,
  ],
  [PaymentIntentStatus.CONFIRMED]: [],
  [PaymentIntentStatus.EXPIRED]: [],
  [PaymentIntentStatus.FAILED]: [],
  [PaymentIntentStatus.UNDERPAID]: [],
  [PaymentIntentStatus.OVERPAID]: [],
  [PaymentIntentStatus.LATE_PAID]: [],
};

@Injectable()
export class PaymentStateService {
  assertIntentTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): void {
    if (from === to) {
      return;
    }

    if (!ALLOWED_INTENT_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(`Invalid payment intent status transition ${from} -> ${to}`);
    }
  }

  toIntentStatus(paymentStatus: PaymentStatus): PaymentIntentStatus {
    switch (paymentStatus) {
      case PaymentStatus.DETECTED:
        return PaymentIntentStatus.DETECTED;
      case PaymentStatus.CONFIRMING:
        return PaymentIntentStatus.CONFIRMING;
      case PaymentStatus.CONFIRMED:
        return PaymentIntentStatus.CONFIRMED;
      case PaymentStatus.FAILED:
        return PaymentIntentStatus.FAILED;
      case PaymentStatus.UNDERPAID:
        return PaymentIntentStatus.UNDERPAID;
      case PaymentStatus.OVERPAID:
        return PaymentIntentStatus.OVERPAID;
      case PaymentStatus.LATE_PAID:
        return PaymentIntentStatus.LATE_PAID;
    }
  }
}
