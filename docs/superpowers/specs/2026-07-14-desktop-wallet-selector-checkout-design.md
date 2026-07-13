# Desktop Wallet Selector Checkout Design

Date: 2026-07-14

## Summary

FlowDex `/buy` will use the same progressive-disclosure pattern verified on Uniswap, PancakeSwap, and Jupiter: one compact payment form, one contextual primary action, and one standard wallet-selection surface. Wallet details will not occupy the payment form, and users will not choose a chain, device category, or transaction method manually.

The first release is desktop-first. It will not add a mobile FlowDex checkout, mobile deep links, mobile-specific device detection, or responsive mobile wallet orchestration. Desktop WalletConnect QR remains allowed as a standard desktop connection mechanism, but FlowDex will not build or maintain a corresponding mobile web flow.

The existing backend payment lifecycle remains unchanged:

```text
create intent
-> prepare immutable wallet action
-> wallet approval and broadcast
-> submit transaction id
-> track backend confirmation
```

## Benchmark Findings

The live comparison established a consistent product pattern:

- Uniswap keeps the amount and asset controls in one transaction card. Wallet selection is a separate surface with featured wallets, WalletConnect, and other wallets behind progressive disclosure.
- PancakeSwap keeps top wallets visible and collapses the remaining wallet catalog behind `More wallets`.
- Jupiter shows a recommended wallet and QR option first, with `View more wallets` collapsed.
- THORSwap supports native Bitcoin but asks users to select chains, device categories, and wallet types. That model is intentionally rejected for FlowDex because the selected payment asset already determines the chain.

Reference interfaces:

- https://app.uniswap.org/swap
- https://pancakeswap.finance/swap
- https://jup.ag/swap/SOL-USDC
- https://app.thorswap.finance/swap

## Goals

- Reduce `/buy` to one editable payment amount field with an embedded asset selector.
- Use one contextual primary action: connect, switch network, buy, or wait for wallet approval.
- Support multiple compatible Bitcoin wallets without maintaining one FlowDex adapter per wallet.
- Keep wallet connection separate from transaction execution: connecting returns the user to the form, and buying remains an explicit second user action.
- Remove duplicated pre-transaction summaries and connection-stage screens.
- Keep direct-send and manual-address payment UX absent.
- Preserve existing backend-prepared transaction safety and post-broadcast recovery.

## Non-goals

- A mobile FlowDex checkout or mobile-specific wallet interface.
- Mobile deep links or same-device WalletConnect routing.
- Social login, embedded wallets, passkeys, or custodial accounts.
- A THORSwap-style chain, device, or wallet-category wizard.
- Migrating the existing Ethereum, Solana, or Tron execution stacks to Reown AppKit.
- Changing payment pricing, treasury derivation, intent persistence, reconciliation, or confirmation rules.
- Reintroducing manual/direct-send payment instructions.

## User Experience

### Payment card

The payment card contains:

1. A `You pay` amount input.
2. An asset selector embedded on the right side of that input.
3. A read-only `You receive` value for `$FDN`.
4. The existing listing value and potential return context in a compact summary.
5. One full-width primary action.

The standalone currency-button grid and the `Custom Amount` label are removed. The asset selector contains only backend-enabled checkout capabilities.

### Primary action

The action label is derived from current state:

- disconnected: `Connect wallet`
- wrong network: `Switch network`
- connected and ready: `Buy <amount> $FDN`
- preparing: `Preparing transaction`
- awaiting approval: `Confirm in your wallet`
- submitting: `Recording transaction`

The form never shows `Buy` while no compatible wallet is connected. Connecting a wallet does not automatically start a payment or open a transaction approval prompt.

### Wallet selection

Pressing `Connect wallet` opens the wallet surface for the selected asset's chain. The user does not select a chain separately.

For Bitcoin:

- open Reown AppKit in the Bitcoin `bip122` namespace;
- show compatible detected desktop wallets first;
- expose WalletConnect as a secondary desktop QR option;
- keep the complete compatible wallet catalog behind AppKit's progressive disclosure;
- disable AppKit email, social-login, onramp, and unrelated account features;
- reject connections that do not provide a Bitcoin payment account and a supported transfer method.

For Ethereum, Solana, and Tron, the existing connection and execution integrations remain in place. The payment form owns one `Connect wallet` entrypoint and delegates to the selected chain's existing connector surface. This avoids a cross-chain wallet-infrastructure migration merely to make the visible interaction consistent.

### Connected state

After connection, the user returns to the same payment card. A compact connected-wallet row shows:

- wallet label;
- truncated payment address;
- disconnect/change action.

The duplicated order summary and `Continue with wallet` step are removed. The form already shows the amount, asset, received tokens, and value context before the user presses `Buy`.

### Transaction and tracking

Pressing `Buy` after connection runs the existing wallet-only lifecycle. The wallet remains the final transaction review and approval surface.

After a transaction id exists, FlowDex opens the tracking state and prevents duplicate payment prompts. Refresh recovery and idempotent transaction-id submission remain unchanged.

## Frontend Architecture

### Payment form ownership

`fe/src/app/(marketing)/buy/_components/payment-card.tsx` remains the owner of the pre-transaction form. It will render the integrated amount/asset field, connected-wallet summary, inline error, and contextual action.

The asset selector consumes `BuyOrderView.supportedAssets` and continues to use backend checkout capabilities as the source of truth. No static frontend flag may make a backend-disabled asset selectable.

### Dialog ownership

`payment-dialogs.tsx` will stop owning wallet selection, connected-wallet review, and the duplicate order summary. It will retain only states that materially benefit from a modal or expanded surface:

- transaction preparation/approval progress when the form is blocked;
- post-broadcast tracking;
- recoverable post-broadcast errors.

Expected connection errors and unsupported-wallet messages render inline on the payment card or inside the standard wallet provider modal.

### Bitcoin provider boundary

Replace the Xverse-specific checkout connection boundary with one Bitcoin provider boundary backed by Reown AppKit's Bitcoin adapter.

The boundary exposes only the operations `/buy` needs:

- open the Bitcoin wallet selector;
- read the connected payment account;
- determine connector/session readiness;
- send the backend-prepared transfer through the provider's `sendTransfer` operation;
- disconnect the Bitcoin session.

It does not calculate the amount, choose a recipient, construct a PSBT, select fees, sign raw data, or broadcast outside the wallet provider.

The current public WalletConnect project id is reused. Reown packages must become explicit direct dependencies; FlowDex must not import transitive AppKit packages from another dependency.

### Existing chain boundaries

- Ethereum continues through the current Account Kit/Wagmi provider-managed transaction path.
- Solana continues through the current MetaMask Solana adapter.
- Tron continues through the current TronLink TRC-20 adapter.
- Bitcoin uses the AppKit Bitcoin provider boundary.

This preserves the working execution contracts and avoids a generic cross-chain wallet framework.

## Data Flow

```text
select backend-enabled asset
-> enter payment amount
-> connect wallet for selected chain
-> return to payment form
-> press Buy
-> validate connected account/network/session capability
-> create payment intent
-> request backend-prepared wallet action
-> send exact prepared action through wallet provider
-> record returned transaction id
-> track backend confirmation
```

If the selected asset changes to a different chain, the form derives readiness from that chain's connection. A connection for one chain never authorizes checkout on another chain.

## Error Handling

- Missing compatible wallet: keep the user in the form and reopen the standard wallet selector.
- Unsupported Bitcoin WalletConnect capability: block before intent creation and explain that the connected wallet cannot send this Bitcoin payment.
- User rejects connection: close the selector and keep form input unchanged.
- User rejects transaction: return to the connected form state without marking the wallet unsupported.
- Wrong network: change the primary action to `Switch network` when the provider supports switching; otherwise explain the required network inline.
- Provider disconnect or account change: invalidate readiness before payment preparation.
- Transaction id already exists: resume submission/tracking and never ask the user to pay again.
- Backend capability disables an asset: remove it from the asset selector without a frontend fallback.

## State Model

The current checkout reducer remains the lifecycle owner. Presentation derives from explicit states rather than new booleans.

Pre-broadcast states:

- `closed` / form idle
- `connecting_wallet`
- `wallet_ready`
- `preparing_wallet_action`
- `waiting_for_wallet_approval`
- `submitting_tx_result`

Post-broadcast states:

- `tracking`
- `failed` with recovery context

Connection cancellation and transaction rejection must transition back to a usable form state. A submitted transaction must transition to tracking or recoverable submission, never back to a fresh buy prompt.

## Testing and Verification

### Focused tests

- Amount input and asset selector behave as one field group.
- Only backend-enabled assets appear.
- Disconnected action reads `Connect wallet` and cannot create an intent.
- Connecting returns to the form without automatically creating an intent.
- Connected action reads `Buy <amount> $FDN`.
- Bitcoin selector opens in `bip122` and excludes unrelated namespaces/features.
- Bitcoin checkout accepts a compatible payment account and provider `sendTransfer` result.
- Unsupported or inconclusive Bitcoin wallet capability blocks before intent creation.
- Provider recipient and satoshi amount exactly match the backend-prepared action.
- Transaction rejection does not mark the connector unsupported.
- A returned transaction id resumes tracking after reload without another send.
- Ethereum, Solana, and Tron connector flows remain unchanged.

### Validation gates

Run from `fe/`:

```bash
npm run check:types
npm run lint
npm run check:deps
npm run build:next
```

Also verify manually on desktop:

- ETH connect and checkout readiness;
- SOL connect and checkout readiness;
- BTC detected-wallet connection;
- BTC WalletConnect QR creation and compatible session gate;
- TRON connect and checkout readiness when backend capability is enabled;
- asset switching before and after connection;
- rejection, disconnect, refresh recovery, and post-broadcast tracking.

## Acceptance Criteria

- `/buy` presents one editable payment amount field with an embedded asset selector.
- The primary action accurately represents connect, switch, buy, or progress state.
- No pre-transaction modal duplicates the order summary or adds a `Continue with wallet` step.
- BTC is not limited to the Xverse browser extension.
- Compatible Bitcoin wallets connect through one AppKit Bitcoin surface.
- No mobile FlowDex checkout or mobile-specific routing is added.
- No chain/device/category selection wizard is introduced.
- No manual/direct-send fallback exists.
- Backend payment contracts and confirmation behavior remain unchanged.
- Full frontend validation passes before deployment.
