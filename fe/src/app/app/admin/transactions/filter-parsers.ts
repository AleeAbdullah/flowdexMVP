import { parseAsString } from 'nuqs';

import { defaultAdminTransactionFilters } from './filters';

export const adminTransactionFilterParsers = {
  status: parseAsString.withDefault(defaultAdminTransactionFilters.status),
  network: parseAsString.withDefault(defaultAdminTransactionFilters.network),
  assetCode: parseAsString.withDefault(defaultAdminTransactionFilters.assetCode),
  walletAddress: parseAsString.withDefault(defaultAdminTransactionFilters.walletAddress),
  from: parseAsString.withDefault(defaultAdminTransactionFilters.from),
  to: parseAsString.withDefault(defaultAdminTransactionFilters.to),
};
