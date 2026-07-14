# Multi-wallet TRON checkout design

Date: 2026-07-14

## Outcome

FlowDex `/buy` will support USDT-TRC20 checkout through TronLink, OKX Wallet, Trust Wallet, and MetaMask TRON. TronLink will no longer be a hard requirement. The checkout remains wallet-only: there is no direct-send/manual-address fallback and no custom mobile handoff screen.

One route-local Reown AppKit singleton will own Bitcoin and TRON connections. Alchemy Account Kit remains the direct EVM connector and keeps WalletConnect disabled so there is only one WalletConnect owner on the page.

## User flow

1. The buyer selects USDT-TRC20 and presses the payment button.
2. FlowDex opens the Reown TRON wallet selector with the supported injected wallets: TronLink, OKX, Trust Wallet, and MetaMask TRON.
3. The selected wallet connects on TRON mainnet and supplies the payer address.
4. The backend creates the payment intent and prepares an exact unsigned USDT `transfer(address,uint256)` transaction through Alchemy.
5. The wallet shows its normal transaction approval and signs the prepared transaction.
6. FlowDex sends the signed transaction to a checkout-token-protected backend endpoint. The backend verifies that it matches the stored prepared action, broadcasts it through Alchemy, and returns the TRON txid.
7. The existing tx-result and reconciliation lifecycle records and confirms the payment.

If no supported wallet is available, opening the selector is still the primary response. The page must not immediately show the old `TronLink is not available` error or a generic install/unlock toast.

## Frontend architecture

- Create one module-scoped Reown AppKit instance configured with `BitcoinAdapter` and `TronAdapter`.
- Configure `TronAdapter` with the exact compatible TronLink, OKX, Trust Wallet, and MetaMask TRON adapters.
- Keep the Bitcoin hook scoped to the `bip122` namespace.
- Add a TRON checkout hook scoped to the `tron` namespace. It exposes connection state, wallet name, connect/disconnect, and prepared-action execution.
- Do not use Reown's generic TRON native-transfer method for USDT. Request the selected connector to sign the backend-prepared unsigned transaction.
- Send the signed transaction to the backend broadcast endpoint, then return the txid to the existing checkout machine.
- Remove the custom `window.tron`/TronLink-only discovery and transaction adapter after imports are clean.
- Keep wallet labels dynamic so the UI shows the wallet the buyer actually selected.
- TRON WalletConnect sessions are not advertised in this release. The supported set is the four approved injected adapters; BTC WalletConnect remains available through the same AppKit singleton.

## Backend architecture

- Extend `AlchemyService` with strict TRON smart-contract preparation and signed-transaction broadcast methods.
- During TRON wallet-action preparation, call `/wallet/triggersmartcontract` with:
  - the normalized payer address;
  - the configured USDT contract;
  - `transfer(address,uint256)`;
  - ABI-encoded recipient and exact base-unit amount;
  - the existing fee limit.
- Store the returned unsigned transaction in `payment_wallet_actions.request_json` and include it in the prepared-action response.
- Add a checkout-token-protected broadcast endpoint for a prepared TRON action.
- Before broadcast, require a signature and compare the signed transaction's `txID`, `raw_data_hex`, owner address, contract address, call data, and fee limit with the stored unsigned transaction. The browser cannot substitute a recipient, amount, contract, or payer.
- Broadcast through Alchemy `/wallet/broadcasttransaction` and require a successful result plus a valid 64-character txid.
- Make repeated broadcast requests for the same action idempotent by returning the already-stored txid when available.
- Keep the existing tx-result endpoint and asynchronous reconciliation as the source of payment status.

## Security and failure behavior

- The Alchemy key stays on the backend.
- Checkout capability validation protects both preparation and broadcast.
- Signed transaction fields are validated at the DTO boundary and matched against the stored action before broadcast.
- A wallet rejection is retryable and does not record a payment.
- An unsupported TRON WalletConnect connector receives a clear supported-wallet message; it does not fall back to direct send.
- If broadcast succeeds but the browser loses the response, retrying the same prepared action returns the same txid rather than broadcasting a different payment.
- Provider/indexing delays remain in the existing tracking state and do not trigger a second payment prompt.

## Compatibility

Use versions compatible with the installed Reown AppKit `1.8.22`:

- `@reown/appkit-adapter-tron@1.8.22`
- `@tronweb3/tronwallet-adapter-tronlink@1.1.13`
- `@tronweb3/tronwallet-adapter-okxwallet@1.0.7`
- `@tronweb3/tronwallet-adapter-trust@1.0.2`
- `@tronweb3/tronwallet-adapter-metamask-tron@1.0.1`

## Validation

- Backend unit tests cover unsigned transaction parsing, signed-transaction mismatch rejection, successful/idempotent broadcast, and capability/action ownership.
- Frontend scoped ESLint and TypeScript checks pass.
- Backend TypeScript and targeted Jest tests pass.
- The frontend production build passes.
- Browser verification confirms the TRON selector opens without the old TronLink-only error and the BTC/ETH paths remain intact.
