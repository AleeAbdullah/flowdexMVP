import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  @Cron('*/10 * * * * *')
  scanChains(): void {
    this.logger.debug('Blockchain scan placeholder tick');
  }

  @Cron('*/10 * * * * *')
  trackConfirmations(): void {
    this.logger.debug('Confirmation tracker placeholder tick');
  }

  @Cron('0 * * * *')
  backfillReconciliation(): void {
    this.logger.debug('Reconciliation backfill placeholder tick');
  }
}
