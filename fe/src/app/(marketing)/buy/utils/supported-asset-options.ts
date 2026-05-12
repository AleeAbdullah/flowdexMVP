import { baseSepolia, sepolia } from 'viem/chains';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
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

export function buildSupportedAssetOptions(snapshot: BuySnapshot): SupportedAssetOption[] {
  const market = buildBuyMarketModel(snapshot);

  return market.assetOptions
    .filter(asset => asset.code === 'ETH' && asset.chain in SUPPORTED_NATIVE_CHAIN_CONFIG)
    .map(asset => {
      const config = SUPPORTED_NATIVE_CHAIN_CONFIG[asset.chain as keyof typeof SUPPORTED_NATIVE_CHAIN_CONFIG];

      return {
        id: `${asset.code}:${asset.chain}`,
        code: asset.code,
        label: asset.label,
        chain: asset.chain as 'BASE_SEPOLIA' | 'ETH_SEPOLIA',
        chainId: config.chainId,
        decimals: 18,
        minAmount: asset.minAmount,
        usdPrice: asset.usdPrice,
        minConfirmations: asset.minConfirmations,
      };
    });
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
