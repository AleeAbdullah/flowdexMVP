import { parseAsString } from 'nuqs';

import { defaultAdminTransactionFilters } from './filters';

export const adminTransactionFilterParsers = {
  status: parseAsString.withDefault(defaultAdminTransactionFilters.status),
  chain: parseAsString.withDefault(defaultAdminTransactionFilters.chain),
  asset: parseAsString.withDefault(defaultAdminTransactionFilters.asset),
  senderAddress: parseAsString.withDefault(defaultAdminTransactionFilters.senderAddress),
  receiverAddress: parseAsString.withDefault(defaultAdminTransactionFilters.receiverAddress),
  from: parseAsString.withDefault(defaultAdminTransactionFilters.from),
  to: parseAsString.withDefault(defaultAdminTransactionFilters.to),
};
