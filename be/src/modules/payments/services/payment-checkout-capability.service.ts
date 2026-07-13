import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { env } from '../../../infrastructure/config/env';
import { PaymentIntentEntity } from '../entities/payment-intent.entity';
import { TERMINAL_PAYMENT_INTENT_STATUSES } from '../payments.types';

@Injectable()
export class PaymentCheckoutCapabilityService {
  issue(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString('base64url');
    return {
      rawToken,
      tokenHash: this.hash(rawToken),
    };
  }

  assertCanPrepare(intent: PaymentIntentEntity, token: string, now = new Date()): void {
    this.assertToken(intent, token);
    if (intent.expiresAt.getTime() <= now.getTime()) {
      throw new BadRequestException('Payment intent expired');
    }
  }

  assertCanSubmit(intent: PaymentIntentEntity, token: string, now = new Date()): void {
    this.assertToken(intent, token);
    const submissionDeadline = intent.expiresAt.getTime()
      + env.paymentLateSubmissionGraceMinutes * 60_000;
    if (submissionDeadline <= now.getTime()) {
      throw new BadRequestException('Payment intent submission window expired');
    }
  }

  private assertToken(intent: PaymentIntentEntity, token: string): void {
    if (TERMINAL_PAYMENT_INTENT_STATUSES.has(intent.status)) {
      throw new BadRequestException('Payment intent is already final');
    }
    if (!token.trim() || !intent.checkoutTokenHash) {
      throw new UnauthorizedException('Missing payment checkout token');
    }

    const expected = Buffer.from(intent.checkoutTokenHash, 'hex');
    const received = Buffer.from(this.hash(token), 'hex');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Invalid payment checkout token');
    }
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
