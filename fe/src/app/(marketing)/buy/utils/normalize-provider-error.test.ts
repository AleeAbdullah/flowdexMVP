import { describe, expect, it } from 'vitest';
import { normalizeProviderError } from './normalize-provider-error';

describe('normalizeProviderError', () => {
  it('maps user rejection distinctly', () => {
    expect(normalizeProviderError({
      code: 4001,
      message: 'User rejected the request.',
    })).toEqual({
      reason: 'user_rejected',
      message: 'The transaction request was canceled in the wallet.',
      originalCode: 4001,
    });
  });

  it('maps insufficient funds distinctly', () => {
    expect(normalizeProviderError(new Error('insufficient funds for gas * price + value'))).toEqual({
      reason: 'insufficient_funds',
      message: 'The connected wallet does not have enough ETH to cover this contribution and gas.',
      originalCode: undefined,
    });
  });
});
