import { baseSepolia, sepolia } from 'viem/chains';
import type { BuySnapshot } from '../../../../components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '../../../../components/flowdex/buy-page-market';
import type { SupportedAssetOption } from '../types/buy-view-model';

export const SUPPORTED_NATIVE_CHAIN_CONFIG = {
  BASE_SEPOLIA: {
    chain: baseSepolia,
    chainId: 84532,
    label: 'Base Sepolia',
  },
  ETH_SEPOLIA: {
    chain: sepolia,
    chainId: 11155111,
    label: 'Ethereum Sepolia',
  },
} as const;

type SupportedNativeChainKey = keyof typeof SUPPORTED_NATIVE_CHAIN_CONFIG;

function normalizeSupportedChains(chain: string) {
  const normalized = chain.trim().toUpperCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'BASE':
    case 'BASE_SEPOLIA':
      return ['BASE_SEPOLIA'] satisfies SupportedNativeChainKey[];
    case 'ETH':
    case 'ETHEREUM':
    case 'SEPOLIA':
    case 'ETH_SEPOLIA':
    case 'ETHEREUM_SEPOLIA':
      return ['ETH_SEPOLIA'] satisfies SupportedNativeChainKey[];
    case 'EVM':
      return ['BASE_SEPOLIA', 'ETH_SEPOLIA'] satisfies SupportedNativeChainKey[];
    default:
      return [] as SupportedNativeChainKey[];
  }
}

export function buildSupportedAssetOptions(snapshot: BuySnapshot): SupportedAssetOption[] {
  const market = buildBuyMarketModel(snapshot);
  const seen = new Set<string>();

  return market.assetOptions
    .filter(asset => asset.code === 'ETH')
    .flatMap((asset) => {
      return normalizeSupportedChains(asset.chain).flatMap((chainKey) => {
        const id = `${asset.code}:${chainKey}`;
        if (seen.has(id)) {
          return [];
        }

        seen.add(id);

        const config = SUPPORTED_NATIVE_CHAIN_CONFIG[chainKey];

        return [{
          id,
          code: asset.code,
          label: asset.label,
          chain: chainKey,
          chainId: config.chainId,
          decimals: 18,
          minAmount: asset.minAmount,
          usdPrice: asset.usdPrice,
          minConfirmations: asset.minConfirmations,
        } satisfies SupportedAssetOption];
      });
    });
}

export function resolvePreferredSupportedAssetId(input: {
  selectedAssetId: string | null;
  preserveSelectedAsset: boolean;
  supportedAssets: SupportedAssetOption[];
  verifiedChainId: number | null;
  providerChainId: number | null;
}) {
  if (
    input.preserveSelectedAsset
    && input.selectedAssetId
    && input.supportedAssets.some((asset) => asset.id === input.selectedAssetId)
  ) {
    return input.selectedAssetId;
  }

  if (input.providerChainId) {
    const providerMatch = input.supportedAssets.find((asset) => asset.chainId === input.providerChainId);
    if (providerMatch) {
      return providerMatch.id;
    }
  }

  if (input.verifiedChainId) {
    const verifiedMatch = input.supportedAssets.find((asset) => asset.chainId === input.verifiedChainId);
    if (verifiedMatch) {
      return verifiedMatch.id;
    }
  }

  return input.supportedAssets[0]?.id ?? null;
}

export function getChainLabel(chain: 'BASE_SEPOLIA' | 'ETH_SEPOLIA') {
  return SUPPORTED_NATIVE_CHAIN_CONFIG[chain].label;
}

export function getChainLabelFromId(chainId: number | null | undefined) {
  if (chainId === SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId) {
    return SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.label;
  }

  if (chainId === SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId) {
    return SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.label;
  }

  return null;
}
