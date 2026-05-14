import { describe, expect, it, vi } from 'vitest';
import { sendBuyTransaction } from './send-buy-transaction';

const request = {
  chainId: 11155111,
  to: '0x1111111111111111111111111111111111111111' as const,
  value: '0x2386f26fc10000' as const,
  data: '0x' as const,
};

function createConnector(provider: {
  request: ReturnType<typeof vi.fn>;
}) {
  return {
    getProvider: vi.fn().mockResolvedValue(provider),
  };
}

describe('sendBuyTransaction', () => {
  it('re-reads wallet state and sends through eth_sendTransaction', async () => {
    const provider = {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return ['0x1111111111111111111111111111111111111111'];
        }

        if (method === 'eth_chainId') {
          return '0xaa36a7';
        }

        if (method === 'eth_sendTransaction') {
          return '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        }

        return null;
      }),
    };

    const result = await sendBuyTransaction({
      connector: createConnector(provider) as never,
      connectedAddress: '0x1111111111111111111111111111111111111111',
      verifiedWalletAddress: '0x1111111111111111111111111111111111111111',
      request,
    });

    expect(result).toEqual({
      txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    expect(provider.request).toHaveBeenNthCalledWith(3, {
      method: 'eth_sendTransaction',
      params: [{
        from: '0x1111111111111111111111111111111111111111',
        to: '0x1111111111111111111111111111111111111111',
        value: '0x2386f26fc10000',
        data: '0x',
      }],
    });
  });

  it('blocks submission when the connected account changes after simulation', async () => {
    const provider = {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return ['0x2222222222222222222222222222222222222222'];
        }

        if (method === 'eth_chainId') {
          return '0xaa36a7';
        }

        return null;
      }),
    };

    const result = await sendBuyTransaction({
      connector: createConnector(provider) as never,
      connectedAddress: '0x1111111111111111111111111111111111111111',
      verifiedWalletAddress: '0x1111111111111111111111111111111111111111',
      request,
    });

    expect(result).toEqual({
      error: {
        reason: 'account_mismatch',
        message: 'The connected wallet no longer matches the verified wallet.',
        originalCode: undefined,
      },
    });
    expect(provider.request).toHaveBeenCalledTimes(2);
  });

  it('blocks submission when the connected chain changes after simulation', async () => {
    const provider = {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return ['0x1111111111111111111111111111111111111111'];
        }

        if (method === 'eth_chainId') {
          return '0x14a34';
        }

        return null;
      }),
    };

    const result = await sendBuyTransaction({
      connector: createConnector(provider) as never,
      connectedAddress: '0x1111111111111111111111111111111111111111',
      verifiedWalletAddress: '0x1111111111111111111111111111111111111111',
      request,
    });

    expect(result).toEqual({
      error: {
        reason: 'wrong_chain',
        message: 'The connected wallet is on the wrong network for this checkout.',
        originalCode: undefined,
      },
    });
    expect(provider.request).toHaveBeenCalledTimes(2);
  });
});
