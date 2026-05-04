import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

import { MarketsService } from './markets.service';

function mockFetchJson(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('MarketsService', () => {
  let service: MarketsService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new MarketsService();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps CoinGecko market data into FlowDex crypto market DTOs', async () => {
    fetchMock
      .mockResolvedValueOnce(mockFetchJson(['usd', 'eur']))
      .mockResolvedValueOnce(mockFetchJson([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://example.com/btc.png',
          current_price: 78776,
          market_cap: 1577752761528,
          market_cap_rank: 1,
          total_volume: 16997700311,
          price_change_percentage_24h: 0.87277,
          last_updated: '2026-05-02T23:36:42.384Z',
        },
      ]));

    const response = await service.getCryptoMarkets({ quote: 'usd', limit: 6 });

    expect(response).toEqual(expect.objectContaining({
      quoteCurrency: 'usd',
      provider: 'coingecko',
      cacheStatus: 'fresh',
    }));
    expect(response.items).toEqual([
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        imageUrl: 'https://example.com/btc.png',
        rank: 1,
        quoteCurrency: 'usd',
        currentPrice: '78776',
        marketCap: '1577752761528',
        totalVolume: '16997700311',
        priceChangePercentage24h: '0.87277',
        lastUpdated: '2026-05-02T23:36:42.384Z',
      },
    ]);
  });

  it('uses a valid one-minute market cache before calling CoinGecko again', async () => {
    fetchMock
      .mockResolvedValueOnce(mockFetchJson(['usd']))
      .mockResolvedValueOnce(mockFetchJson([
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          image: null,
          current_price: 2321.72,
          market_cap: 280279845849,
          market_cap_rank: 2,
          total_volume: 6771569312,
          price_change_percentage_24h: 1.30752,
          last_updated: '2026-05-02T23:36:42.226Z',
        },
      ]));

    await service.getCryptoMarkets({ quote: 'usd', limit: 6 });
    const cached = await service.getCryptoMarkets({ quote: 'usd', limit: 6 });

    expect(cached.cacheStatus).toBe('cached');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns stale market data when provider refresh fails after cache expiry', async () => {
    fetchMock
      .mockResolvedValueOnce(mockFetchJson(['usd']))
      .mockResolvedValueOnce(mockFetchJson([
        {
          id: 'tether',
          symbol: 'usdt',
          name: 'Tether',
          image: null,
          current_price: 0.999876,
          market_cap: 189560136365,
          market_cap_rank: 3,
          total_volume: 83342358037,
          price_change_percentage_24h: 0.00674,
          last_updated: '2026-05-02T23:36:42.196Z',
        },
      ]))
      .mockResolvedValueOnce(mockFetchJson({ error: 'rate limited' }, false, 429));

    await service.getCryptoMarkets({ quote: 'usd', limit: 6 });
    jest.spyOn(Date, 'now').mockReturnValue(62_000);

    const stale = await service.getCryptoMarkets({ quote: 'usd', limit: 6 });

    expect(stale.cacheStatus).toBe('stale');
    expect(stale.items[0]?.symbol).toBe('USDT');
  });

  it('rejects unsupported quote currencies before fetching market data', async () => {
    fetchMock.mockResolvedValueOnce(mockFetchJson(['usd']));

    await expect(service.getCryptoMarkets({ quote: 'zzz', limit: 6 }))
      .rejects
      .toBeInstanceOf(BadRequestException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when CoinGecko is unavailable and there is no stale market cache', async () => {
    fetchMock
      .mockResolvedValueOnce(mockFetchJson(['usd']))
      .mockResolvedValueOnce(mockFetchJson({ error: 'unavailable' }, false, 503));

    await expect(service.getCryptoMarkets({ quote: 'usd', limit: 6 }))
      .rejects
      .toBeInstanceOf(ServiceUnavailableException);
  });
});
