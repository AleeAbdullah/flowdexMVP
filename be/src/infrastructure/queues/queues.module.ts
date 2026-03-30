import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

const queueNames = [
  'price-sync',
  'chain-scan-eth',
  'chain-scan-erc20',
  'chain-scan-trc20',
  'confirmation-tracker',
  'intent-expiry',
  'reconciliation-backfill',
] as const;

@Module({
  imports: [BullModule.registerQueue(...queueNames.map((name) => ({ name })))],
  exports: [BullModule],
})
export class QueuesModule {}
