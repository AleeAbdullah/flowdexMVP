export const CRYPTO_ASSET_ICON_SRC = {
  eth: '/assets/crypto/eth.svg',
  btc: '/assets/crypto/btc.svg',
  sol: '/assets/crypto/sol.svg',
  tron: '/assets/crypto/tron.svg',
  trx: '/assets/crypto/tron.svg',
  usdt_trc20: '/assets/crypto/tron.svg',
} as const;

export function getCryptoAssetIconSrc(assetCode: string | null | undefined) {
  const key = (assetCode ?? '').trim().toLowerCase();
  return CRYPTO_ASSET_ICON_SRC[key as keyof typeof CRYPTO_ASSET_ICON_SRC] ?? null;
}
