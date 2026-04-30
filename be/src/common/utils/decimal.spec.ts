import { normalizeFixed, parseFixed } from './decimal';

describe('decimal utils', () => {
  it('parses plain decimal strings at the default scale', () => {
    expect(parseFixed('1.23')).toBe(1230000000000000000n);
  });

  it('normalizes scientific notation values', () => {
    expect(normalizeFixed('3e-17')).toBe('0.00000000000000003');
    expect(normalizeFixed(3e-17)).toBe('0.00000000000000003');
  });

  it('truncates values smaller than the supported scale to zero', () => {
    expect(normalizeFixed('3e-19')).toBe('0');
  });

  it('supports positive exponents', () => {
    expect(normalizeFixed('1.2e3')).toBe('1200');
  });
});
