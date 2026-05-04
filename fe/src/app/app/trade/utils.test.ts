import { describe, expect, it } from 'vitest';
import {
  formatMarketCompact,
  formatMarketPercent,
  formatMarketPrice,
  parseMarketNumber,
} from './utils';

describe('trade market utils', () => {
  it('parses valid numeric market strings', () => {
    expect(parseMarketNumber('2321.72')).toBe(2321.72);
    expect(parseMarketNumber(null)).toBeNull();
    expect(parseMarketNumber('not-a-number')).toBeNull();
  });

  it('formats fiat market prices with currency symbols', () => {
    expect(formatMarketPrice('78776', 'usd')).toBe('$78,776.00');
    expect(formatMarketPrice('0.999876', 'usd')).toBe('$0.999876');
  });

  it('formats crypto quote prices with quote suffixes', () => {
    expect(formatMarketPrice('1.23456789', 'btc')).toBe('1.2346 BTC');
  });

  it('formats compact market values and 24h percentage moves', () => {
    expect(formatMarketCompact('1577752761528', 'usd')).toBe('$1.58T');
    expect(formatMarketPercent('0.87277')).toBe('+0.87%');
    expect(formatMarketPercent('-1.2')).toBe('-1.20%');
  });
});
