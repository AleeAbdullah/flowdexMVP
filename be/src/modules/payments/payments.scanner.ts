import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { env } from '../../infrastructure/config/env';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentsScanner {
  private readonly logger = new Logger(PaymentsScanner.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron(env.paymentScannerCron)
  async scanOpenIntents(): Promise<void> {
    const scanned = await this.paymentsService.scanOpenIntents();
    if (scanned > 0) {
      this.logger.log(`Scanned ${scanned} open payment intents.`);
    }
  }
}
