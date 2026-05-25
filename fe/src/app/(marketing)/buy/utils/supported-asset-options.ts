import { mainnet } from 'viem/chains';
import type { BuySnapshot } from '../../../../components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '../../../../components/flowdex/buy-page-market';
import {
  PAYMENT_ASSETS,
  PAYMENT_CHAINS,
  type PaymentAsset,
  type PaymentChain,
} from '../../../../dal/app/payments/payments.types';
import type { SupportedAssetOption } from '../types/buy-view-model';

export const SUPPORTED_NATIVE_CHAIN_CONFIG = {
  ETHEREUM: {
    chainId: mainnet.id,
    label: 'Ethereum Mainnet',
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    label: 'Base Sepolia',
  },
  ETH_SEPOLIA: {
    chainId: 11155111,
    label: 'Ethereum Sepolia',
  },
} as const;

const PAYMENT_ASSET_DECIMALS: Record<PaymentAsset, number> = {
  ETH: 18,
  SOL: 9,
  BTC: 8,
};

const PAYMENT_CHAIN_LABELS: Record<PaymentChain, string> = {
  ETHEREUM: 'Ethereum',
  SOLANA: 'Solana',
  BITCOIN: 'Bitcoin',
};

const PAYMENT_ASSET_LABELS: Record<PaymentAsset, string> = {
  ETH: 'Ethereum',
  SOL: 'Solana',
  BTC: 'Bitcoin',
};

const PAYMENT_CHAIN_BY_ASSET: Record<PaymentAsset, PaymentChain> = {
  ETH: PAYMENT_CHAINS.ETHEREUM,
  SOL: PAYMENT_CHAINS.SOLANA,
  BTC: PAYMENT_CHAINS.BITCOIN,
};

const FALLBACK_PRICES: Record<PaymentAsset, number> = {
  ETH: 2850,
  SOL: 190,
  BTC: 65000,
};

const ENABLED_PAYMENT_ASSETS: PaymentAsset[] = [
  PAYMENT_ASSETS.ETH,
  PAYMENT_ASSETS.SOL,
];

function getAssetPrice(snapshot: BuySnapshot, asset: PaymentAsset) {
  const market = buildBuyMarketModel(snapshot);
  const marketOption = market.assetOptions.find(option => option.code.toUpperCase() === asset);
  return marketOption?.usdPrice && marketOption.usdPrice > 0
    ? marketOption.usdPrice
    : FALLBACK_PRICES[asset];
}

export function buildSupportedAssetOptions(snapshot: BuySnapshot): SupportedAssetOption[] {
  return ENABLED_PAYMENT_ASSETS.map((asset) => {
    const chain = PAYMENT_CHAIN_BY_ASSET[asset];
    return {
      id: `${asset}:${chain}`,
      code: asset,
      label: PAYMENT_ASSET_LABELS[asset],
      chain,
      networkLabel: PAYMENT_CHAIN_LABELS[chain],
      chainId: chain === PAYMENT_CHAINS.ETHEREUM ? mainnet.id : null,
      decimals: PAYMENT_ASSET_DECIMALS[asset],
      usdPrice: getAssetPrice(snapshot, asset),
    };
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
    && input.supportedAssets.some(asset => asset.id === input.selectedAssetId)
  ) {
    return input.selectedAssetId;
  }

  if (input.providerChainId) {
    const providerMatch = input.supportedAssets.find(asset => asset.chainId === input.providerChainId);
    if (providerMatch) {
      return providerMatch.id;
    }
  }

  if (input.verifiedChainId) {
    const verifiedMatch = input.supportedAssets.find(asset => asset.chainId === input.verifiedChainId);
    if (verifiedMatch) {
      return verifiedMatch.id;
    }
  }

  return input.supportedAssets[0]?.id ?? null;
}

export function getChainLabel(chain: SupportedAssetOption['chain']) {
  if (chain === 'BASE_SEPOLIA' || chain === 'ETH_SEPOLIA') {
    return SUPPORTED_NATIVE_CHAIN_CONFIG[chain].label;
  }

  return PAYMENT_CHAIN_LABELS[chain];
}

export function getChainLabelFromId(chainId: number | null | undefined) {
  if (chainId === mainnet.id) {
    return PAYMENT_CHAIN_LABELS.ETHEREUM;
  }

  return null;
}
