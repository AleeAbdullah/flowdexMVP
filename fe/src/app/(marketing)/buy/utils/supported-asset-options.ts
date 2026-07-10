import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { Env } from '@/libs/Env';
import {
  PAYMENT_ASSETS,
  PAYMENT_CHAINS,
  type PaymentAsset,
} from '@/dal/app/payments/payments.types';
import {
  TRON_MAINNET_WALLET_CHAIN_ID,
  TRON_WALLET_NETWORK_ID,
} from '../constants/tronlink';
import type { SupportedAssetOption } from '../types/buy-view-model';

const enabledAssets: PaymentAsset[] = [
  PAYMENT_ASSETS.ETH,
  PAYMENT_ASSETS.SOL,
  PAYMENT_ASSETS.BTC,
  ...(Env.NEXT_PUBLIC_USDT_MANUAL_CHECKOUT_ENABLED || Env.NEXT_PUBLIC_USDT_WALLET_CHECKOUT_ENABLED
    ? [PAYMENT_ASSETS.USDT_TRC20]
    : []),
];

const assetConfig: Record<PaymentAsset, {
  chain: typeof PAYMENT_CHAINS[keyof typeof PAYMENT_CHAINS];
  chainId: number | null;
  walletChainId: string | null;
  walletNetworkId: string | null;
  walletCheckoutEnabled: boolean;
}> = {
  ETH: { chain: PAYMENT_CHAINS.ETHEREUM, chainId: 1, walletChainId: null, walletNetworkId: null, walletCheckoutEnabled: true },
  SOL: { chain: PAYMENT_CHAINS.SOLANA, chainId: null, walletChainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', walletNetworkId: 'solana:mainnet', walletCheckoutEnabled: true },
  BTC: { chain: PAYMENT_CHAINS.BITCOIN, chainId: null, walletChainId: null, walletNetworkId: null, walletCheckoutEnabled: false },
  USDT_TRC20: {
    chain: PAYMENT_CHAINS.TRON,
    chainId: null,
    walletChainId: TRON_MAINNET_WALLET_CHAIN_ID,
    walletNetworkId: TRON_WALLET_NETWORK_ID,
    walletCheckoutEnabled: Env.NEXT_PUBLIC_USDT_WALLET_CHECKOUT_ENABLED,
  },
};

const fallbackPrices: Record<PaymentAsset, number> = {
  ETH: 2850,
  SOL: 190,
  BTC: 65000,
  USDT_TRC20: 1,
};

const decimals: Record<PaymentAsset, number> = {
  ETH: 18,
  SOL: 9,
  BTC: 8,
  USDT_TRC20: 6,
};

const labels: Record<PaymentAsset, string> = {
  ETH: 'ETH',
  SOL: 'SOL',
  BTC: 'BTC',
  USDT_TRC20: 'USDT TRC20',
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
    const { chain, chainId, walletChainId, walletNetworkId, walletCheckoutEnabled } = assetConfig[asset];
    return {
      id: asset,
      code: asset,
      label: labels[asset],
      chain,
      chainId,
      walletChainId,
      walletNetworkId,
      walletCheckoutEnabled,
      decimals: decimals[asset],
      usdPrice: getAssetPrice(snapshot, asset),
    };
  });
}
