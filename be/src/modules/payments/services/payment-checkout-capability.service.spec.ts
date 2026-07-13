import { PaymentCheckoutCapabilityService } from './payment-checkout-capability.service';
import { env } from '../../../infrastructure/config/env';
import { PaymentIntentStatus } from '../payments.types';

describe('PaymentCheckoutCapabilityService', () => {
  const service = new PaymentCheckoutCapabilityService();
  const originalGrace = env.paymentLateSubmissionGraceMinutes;

  afterEach(() => {
    env.paymentLateSubmissionGraceMinutes = originalGrace;
  });

  function buildIntent(input: Partial<{ checkoutTokenHash: string; expiresAt: Date; status: PaymentIntentStatus }> = {}) {
    return {
      checkoutTokenHash: input.checkoutTokenHash ?? null,
      expiresAt: input.expiresAt ?? new Date('2026-07-13T10:00:00.000Z'),
      status: input.status ?? PaymentIntentStatus.WAITING,
    } as never;
  }

  it('accepts valid token submission through the late-submission grace window', () => {
    env.paymentLateSubmissionGraceMinutes = 30;
    const issued = service.issue();
    const intent = buildIntent({ checkoutTokenHash: issued.tokenHash });

    expect(() => service.assertCanSubmit(intent, issued.rawToken, new Date('2026-07-13T10:15:00.000Z'))).not.toThrow();
    expect(() => service.assertCanPrepare(intent, issued.rawToken, new Date('2026-07-13T10:15:00.000Z'))).toThrow('Payment intent expired');
  });

  it('rejects missing and invalid tokens', () => {
    const issued = service.issue();
    const intent = buildIntent({ checkoutTokenHash: issued.tokenHash });

    expect(() => service.assertCanPrepare(intent, '', new Date('2026-07-13T09:00:00.000Z'))).toThrow('Missing payment checkout token');
    expect(() => service.assertCanPrepare(intent, 'wrong', new Date('2026-07-13T09:00:00.000Z'))).toThrow('Invalid payment checkout token');
  });
});
