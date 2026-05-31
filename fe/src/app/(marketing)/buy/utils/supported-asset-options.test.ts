import { describe, expect, it } from 'vitest';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import {
  buildSupportedAssetOptions,
  resolvePreferredSupportedAssetId,
  SUPPORTED_NATIVE_CHAIN_CONFIG,
} from './supported-asset-options';

function buildSnapshot(): NonNullable<BuySnapshot> {
  return {
    pricing: {
      items: [
        {
          assetCode: 'ETH',
          chain: 'ETHEREUM',
          priceUsd: '2500',
          updatedAt: '2026-05-14T00:00:00.000Z',
        },
        {
          assetCode: 'SOL',
          chain: 'SOLANA',
          priceUsd: '150',
          updatedAt: '2026-05-14T00:00:00.000Z',
        },
        {
          assetCode: 'BTC',
          chain: 'BITCOIN',
          priceUsd: '65000',
          updatedAt: '2026-05-14T00:00:00.000Z',
        },
      ],
    },
    presaleStats: {
      fundsRaisedRealUsd: '0',
      fundsRaisedDisplayUsd: '0',
      tokensSoldReal: '0',
      tokensSoldDisplay: '0',
      currentTier: 1,
      currentTokenPriceUsd: '0.001',
      displayMultiplier: 1,
      updatedAt: '2026-05-14T00:00:00.000Z',
    },
    presaleTiers: {
      items: [],
    },
    presaleConfig: {
      supportedAssets: [
        {
          assetCode: 'ETH',
          chain: 'ETHEREUM',
          minConfirmations: 2,
          minAmount: '0.01',
        },
        {
          assetCode: 'SOL',
          chain: 'SOLANA',
          minConfirmations: 3,
          minAmount: '0.1',
        },
        {
          assetCode: 'BTC',
          chain: 'BITCOIN',
          minConfirmations: 2,
          minAmount: '0.0001',
        },
      ],
      minConfirmationsByAsset: {},
      displayMultiplier: 1,
    },
  };
}

describe('buildSupportedAssetOptions', () => {
  it('exposes Ethereum, Solana, and Bitcoin payment options', () => {
    const options = buildSupportedAssetOptions(null);

    expect(options.map(option => option.id)).toEqual([
      'ETH:ETHEREUM',
      'SOL:SOLANA',
      'BTC:BITCOIN',
    ]);
    expect(options.map(option => option.chainId)).toEqual([
      SUPPORTED_NATIVE_CHAIN_CONFIG.ETHEREUM.chainId,
      null,
      null,
    ]);
  });

  it('uses live ETH, SOL, and BTC prices from the snapshot', () => {
    const options = buildSupportedAssetOptions(buildSnapshot());

    expect(options.map(option => option.code)).toEqual(['ETH', 'SOL', 'BTC']);
    expect(options.map(option => option.usdPrice)).toEqual([2500, 150, 65000]);
  });

  it('preserves a manual existing supported selection over live provider chain hints', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: 'SOL:SOLANA',
      preserveSelectedAsset: true,
      supportedAssets: options,
      verifiedChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETHEREUM.chainId,
      providerChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETHEREUM.chainId,
    })).toBe('SOL:SOLANA');
  });

  it('uses the live provider chain before a stale existing selection when selection is not manual', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: 'SOL:SOLANA',
      preserveSelectedAsset: false,
      supportedAssets: options,
      verifiedChainId: null,
      providerChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETHEREUM.chainId,
    })).toBe('ETH:ETHEREUM');
  });

  it('preserves a manual Bitcoin selection now that BTC payments are enabled', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: 'BTC:BITCOIN',
      preserveSelectedAsset: true,
      supportedAssets: options,
      verifiedChainId: null,
      providerChainId: null,
    })).toBe('BTC:BITCOIN');
  });
});
