import { PaymentAsset, PaymentChain } from '../payments.types';
import { PaymentBuyConfigService } from './payment-buy-config.service';

describe('PaymentBuyConfigService', () => {
  it('combines live presale state, enabled capabilities, and asset quotes', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([{
        currentTier: 2,
        tokenPriceUsd: '0.002000000000000000',
        nextTierTokenPriceUsd: '0.003000000000000000',
        fundsRaisedUsd: '120000.500000000000000000',
        tokensSold: '60000000.000000000000000000',
        currentTierTokenCap: '500000000.000000000000000000',
        aggregateTokenCap: '2251875000.000000000000000000',
        targetRaisedUsd: '5000000.000000000000000000',
        updatedAt: new Date('2026-07-14T08:00:00.000Z'),
      }]),
    };
    const pricingService = {
      getAssetQuote: jest.fn(async (asset: PaymentAsset) => ({
        priceUsd: asset === PaymentAsset.USDT_TRC20 ? '1' : '3200.25',
        quotedAt: new Date('2026-07-14T08:01:00.000Z'),
        expiresAt: new Date('2026-07-14T08:02:00.000Z'),
        cacheStatus: asset === PaymentAsset.USDT_TRC20 ? 'fixed' : 'fresh',
      })),
    };
    const service = new PaymentBuyConfigService(dataSource as never, pricingService as never);

    const result = await service.getBuyConfig([
      {
        chain: PaymentChain.ETHEREUM,
        asset: PaymentAsset.ETH,
        walletProvider: 'metamask',
        network: 'mainnet',
        decimals: 18,
        enabled: true,
      },
      {
        chain: PaymentChain.TRON,
        asset: PaymentAsset.USDT_TRC20,
        walletProvider: 'reown',
        network: 'mainnet',
        decimals: 6,
        enabled: true,
      },
      {
        chain: PaymentChain.BITCOIN,
        asset: PaymentAsset.BTC,
        walletProvider: 'xverse',
        network: 'mainnet',
        decimals: 8,
        enabled: false,
      },
    ]);

    expect(result.presale).toEqual(expect.objectContaining({
      currentTier: 2,
      tokenPriceUsd: '0.002',
      fundsRaisedUsd: '120000.5',
      tokensSold: '60000000',
      targetRaisedUsd: '5000000',
    }));
    expect(result.assets).toEqual([
      expect.objectContaining({ asset: PaymentAsset.ETH, priceUsd: '3200.25', cacheStatus: 'fresh' }),
      expect.objectContaining({ asset: PaymentAsset.USDT_TRC20, priceUsd: '1', cacheStatus: 'fixed' }),
    ]);
    expect(pricingService.getAssetQuote).not.toHaveBeenCalledWith(PaymentAsset.BTC);
  });
});
