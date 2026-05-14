import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const walletBuyPageClientPath = fileURLToPath(
  new URL('../_components/wallet-buy-page-client.tsx', import.meta.url),
);

describe('wallet buy page client execution path', () => {
  it('does not reference raw signing helpers in the default checkout path', () => {
    const source = readFileSync(walletBuyPageClientPath, 'utf8');

    expect(source).not.toContain('prepareContributionTransaction');
    expect(source).not.toContain('signTransaction');
    expect(source).not.toContain('sendRawTransaction');
  });
});
