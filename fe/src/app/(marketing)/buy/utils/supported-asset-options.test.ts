import { describe, expect, it } from 'vitest';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import {
  buildSupportedAssetOptions,
  resolvePreferredSupportedAssetId,
  SUPPORTED_NATIVE_CHAIN_CONFIG,
} from './supported-asset-options';

describe('buildSupportedAssetOptions', () => {
  it('expands fallback generic EVM ETH into both supported chains when snapshot is unavailable', () => {
    const options = buildSupportedAssetOptions(null);

    expect(options).toHaveLength(2);
    expect(options.map(option => option.id)).toEqual([
      'ETH:BASE_SEPOLIA',
      'ETH:ETH_SEPOLIA',
    ]);
    expect(options.map(option => option.chainId)).toEqual([
      SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId,
      SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
    ]);
  });

  it('normalizes explicit backend chain labels into supported native chains', () => {
    const snapshot: NonNullable<BuySnapshot> = {
      pricing: {
        items: [
          {
            assetCode: 'ETH',
            chain: 'base',
            priceUsd: '2500',
            updatedAt: '2026-05-14T00:00:00.000Z',
          },
          {
            assetCode: 'ETH',
            chain: 'sepolia',
            priceUsd: '2500',
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
            chain: 'base',
            minConfirmations: 2,
            minAmount: '0.01',
          },
          {
            assetCode: 'ETH',
            chain: 'sepolia',
            minConfirmations: 3,
            minAmount: '0.02',
          },
        ],
        minConfirmationsByAsset: {},
        displayMultiplier: 1,
      },
    };

    const options = buildSupportedAssetOptions(snapshot);

    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      id: 'ETH:BASE_SEPOLIA',
      chain: 'BASE_SEPOLIA',
      minConfirmations: 2,
      minAmount: 0.01,
    });
    expect(options[1]).toMatchObject({
      id: 'ETH:ETH_SEPOLIA',
      chain: 'ETH_SEPOLIA',
      minConfirmations: 3,
      minAmount: 0.02,
    });
  });

  it('preserves a manual existing selection over live provider chain hints', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: 'ETH:BASE_SEPOLIA',
      preserveSelectedAsset: true,
      supportedAssets: options,
      verifiedChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
      providerChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
    })).toBe('ETH:BASE_SEPOLIA');
  });

  it('uses the live provider chain before a stale existing selection when selection is not manual', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: 'ETH:BASE_SEPOLIA',
      preserveSelectedAsset: false,
      supportedAssets: options,
      verifiedChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId,
      providerChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
    })).toBe('ETH:ETH_SEPOLIA');
  });

  it('uses the live provider chain before the verified chain when connected', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: null,
      preserveSelectedAsset: false,
      supportedAssets: options,
      verifiedChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
      providerChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId,
    })).toBe('ETH:BASE_SEPOLIA');
  });

  it('uses the live provider chain before the first supported asset when no verified chain exists', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: null,
      preserveSelectedAsset: false,
      supportedAssets: options,
      verifiedChainId: null,
      providerChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
    })).toBe('ETH:ETH_SEPOLIA');
  });

  it('falls back to the verified chain when no live provider chain exists', () => {
    const options = buildSupportedAssetOptions(null);

    expect(resolvePreferredSupportedAssetId({
      selectedAssetId: null,
      preserveSelectedAsset: false,
      supportedAssets: options,
      verifiedChainId: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId,
      providerChainId: null,
    })).toBe('ETH:ETH_SEPOLIA');
  });
});
