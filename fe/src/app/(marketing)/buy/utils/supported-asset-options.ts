import {
  PAYMENT_ASSETS,
  PAYMENT_CHAINS,
  type IPaymentCheckoutCapability,
  type IPaymentBuyConfigResponse,
  type PaymentAsset,
} from '@/dal/app/payments/payments.types';
import {
  TRON_MAINNET_WALLET_CHAIN_ID,
  TRON_WALLET_NETWORK_ID,
} from '../constants/tron';
import type { SupportedAssetOption } from '../types/buy-view-model';

const enabledAssets: PaymentAsset[] = [
  PAYMENT_ASSETS.ETH,
  PAYMENT_ASSETS.SOL,
  PAYMENT_ASSETS.BTC,
  PAYMENT_ASSETS.USDT_TRC20,
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
  BTC: { chain: PAYMENT_CHAINS.BITCOIN, chainId: null, walletChainId: 'mainnet', walletNetworkId: 'bitcoin:mainnet', walletCheckoutEnabled: true },
  USDT_TRC20: {
    chain: PAYMENT_CHAINS.TRON,
    chainId: null,
    walletChainId: TRON_MAINNET_WALLET_CHAIN_ID,
    walletNetworkId: TRON_WALLET_NETWORK_ID,
    walletCheckoutEnabled: true,
  },
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

export function buildSupportedAssetOptions(
  buyConfig: IPaymentBuyConfigResponse,
  capabilities?: IPaymentCheckoutCapability[],
): SupportedAssetOption[] {
  return enabledAssets.flatMap((asset) => {
    const { chain, chainId, walletChainId, walletNetworkId, walletCheckoutEnabled } = assetConfig[asset];
    const capability = capabilities?.find(item => item.asset === asset && item.chain === chain);
    if (capabilities && (!capability || !capability.enabled)) {
      return [];
    }
    return {
      id: asset,
      code: asset,
      label: labels[asset],
      chain,
      chainId,
      walletChainId,
      walletNetworkId,
      walletCheckoutEnabled: walletCheckoutEnabled && (capability?.enabled ?? true),
      decimals: capability?.decimals ?? decimals[asset],
      usdPrice: Number(buyConfig.assets.find(item => item.asset === asset)?.priceUsd ?? 0),
    };
  });
}
