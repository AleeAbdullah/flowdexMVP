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
];

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
    const isEth = asset === PAYMENT_ASSETS.ETH;
    return {
      id: asset,
      code: asset,
      label: asset,
      chain: isEth ? PAYMENT_CHAINS.ETHEREUM : PAYMENT_CHAINS.SOLANA,
      chainId: isEth ? mainnet.id : null,
      decimals: decimals[asset],
      usdPrice: getAssetPrice(snapshot, asset),
    };
  });
}
