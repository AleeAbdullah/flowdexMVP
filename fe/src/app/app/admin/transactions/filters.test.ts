import { describe, expect, it } from 'vitest';

import {
  buildAdminTransactionsQueryString,
  defaultAdminTransactionFilters,
  resolveAdminTransactionFilters,
} from './filters';

describe('admin transaction filters', () => {
  it('resolves search params into the backend filter shape', () => {
    expect(resolveAdminTransactionFilters({
      assetCode: 'ETH',
      from: '2026-01-01T00:00',
      network: ['BASE_SEPOLIA', 'ETH_SEPOLIA'],
      status: 'CONFIRMED',
      to: undefined,
      userId: 'phase2-user',
    })).toEqual({
      assetCode: 'ETH',
      from: '2026-01-01T00:00',
      network: 'BASE_SEPOLIA',
      status: 'CONFIRMED',
      to: '',
      userId: 'phase2-user',
    });
  });

  it('omits empty default filters from backend query strings', () => {
    expect(buildAdminTransactionsQueryString(defaultAdminTransactionFilters)).toBe('');
  });

  it('serializes only active filters for backend requests', () => {
    expect(buildAdminTransactionsQueryString({
      ...defaultAdminTransactionFilters,
      assetCode: 'USDT_ERC20',
      status: 'PENDING',
      userId: '',
    })).toBe('?status=PENDING&assetCode=USDT_ERC20');
  });
});
