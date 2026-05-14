import '../config/load-env';
import 'reflect-metadata';

import dataSource from './data-source';
import { assertRequiredEnv, env } from '../config/env';

async function seed(): Promise<void> {
  assertRequiredEnv();
  await dataSource.initialize();
  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log(`Development seed completed successfully for Alchemy-managed ledger mode (port ${env.port}).`);
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Development seed failed.', error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exitCode = 1;
});
