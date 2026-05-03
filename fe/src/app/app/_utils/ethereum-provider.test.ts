import { describe, expect, it } from 'vitest';

import { normalizeNativeTransactionValue } from './ethereum-provider';

describe('normalizeNativeTransactionValue', () => {
  it('normalizes empty values to zero wei', () => {
    expect(normalizeNativeTransactionValue('')).toBe('0x0');
    expect(normalizeNativeTransactionValue('   ')).toBe('0x0');
  });

  it('normalizes zero decimal values to zero wei', () => {
    expect(normalizeNativeTransactionValue('0')).toBe('0x0');
  });

  it('treats integer decimal input as a native-token amount', () => {
    expect(normalizeNativeTransactionValue('1')).toBe('0xde0b6b3a7640000');
  });

  it('normalizes fractional native-token values to wei hex', () => {
    expect(normalizeNativeTransactionValue('0.01')).toBe('0x2386f26fc10000');
  });

  it('preserves valid hex wei values', () => {
    expect(normalizeNativeTransactionValue('0x2386f26fc10000')).toBe('0x2386f26fc10000');
  });

  it('rejects invalid decimal values', () => {
    expect(() => normalizeNativeTransactionValue('0.0.1')).toThrow('decimal native-token amount');
  });

  it('rejects negative values', () => {
    expect(() => normalizeNativeTransactionValue('-1')).toThrow('cannot be negative');
  });

  it('rejects malformed hex values', () => {
    expect(() => normalizeNativeTransactionValue('0x')).toThrow('valid 0x-prefixed wei amount');
    expect(() => normalizeNativeTransactionValue('0xzz')).toThrow('valid 0x-prefixed wei amount');
  });
});
