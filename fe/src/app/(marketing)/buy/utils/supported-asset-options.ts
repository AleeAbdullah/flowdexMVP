import { mainnet } from 'viem/chains';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import {
  PAYMENT_ASSETS,
  PAYMENT_CHAINS,
  type PaymentAsset,
} from '@/dal/app/payments/payments.types';
import type { SupportedAssetOption } from '../types/buy-view-model';

const enabledAssets: PaymentAsset[] = [
  PAYMENT_ASSETS.ETH,
  PAYMENT_ASSETS.SOL,
  PAYMENT_ASSETS.BTC,
];

const assetConfig: Record<PaymentAsset, { chain: typeof PAYMENT_CHAINS[keyof typeof PAYMENT_CHAINS]; chainId: number | null }> = {
  ETH: { chain: PAYMENT_CHAINS.ETHEREUM, chainId: mainnet.id },
  SOL: { chain: PAYMENT_CHAINS.SOLANA, chainId: null },
  BTC: { chain: PAYMENT_CHAINS.BITCOIN, chainId: null },
};

const fallbackPrices: Record<PaymentAsset, number> = {
  ETH: 2850,
  SOL: 190,
  BTC: 65000,
};

const decimals: Record<PaymentAsset, number> = {
  ETH: 18,
  SOL: 9,
  BTC: 8,
};

function getAssetPrice(snapshot: BuySnapshot, asset: PaymentAsset) {
  const market = buildBuyMarketModel(snapshot);
  const marketOption = market.assetOptions.find(option => option.code.toUpperCase() === asset);
  return marketOption?.usdPrice && marketOption.usdPrice > 0
    ? marketOption.usdPrice
    : fallbackPrices[asset];
}

export function buildSupportedAssetOptions(snapshot: BuySnapshot): SupportedAssetOption[] {
  return enabledAssets.map((asset) => {
    const { chain, chainId } = assetConfig[asset];
    return {
      id: asset,
      code: asset,
      label: asset,
      chain,
      chainId,
      decimals: decimals[asset],
      usdPrice: getAssetPrice(snapshot, asset),
    };
  });
}
