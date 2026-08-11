# Reown wallet catalog hotfix design

Date: 2026-07-14

## Outcome

FlowDex `/buy` will stop exposing Reown's public WalletConnect catalog for Bitcoin and TRON. The selector will show only wallet connectors discovered in the browser, including the configured TronLink, OKX Wallet, Trust Wallet, and MetaMask TRON adapters.

## Change

- Disable Reown WalletConnect connections.
- Hide the `All Wallets` catalog and search entry.
- Preserve injected-wallet detection and the existing Bitcoin and TRON checkout execution paths.
- Do not change live pricing, presale statistics, backend requests, or transaction preparation.

## Accepted trade-off

Bitcoin WalletConnect is unavailable during this hotfix. Buyers must use a supported Bitcoin browser wallet discovered by Reown's Bitcoin adapter.

## Verification

- Scoped ESLint and TypeScript checks pass.
- The production frontend build passes.
- The compiled `/buy` chunk contains `allWallets: 'HIDE'` and `enableWalletConnect: false`.
- Interactive selector verification remains a deployment smoke test because the local production page cannot load its live pricing/presale API.
