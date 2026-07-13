# Desktop Wallet Selector Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This repository's standing workflow preference forbids automatic staging and commits, so checkpoint steps inspect the diff without running `git add` or `git commit`.

**Goal:** Simplify the desktop `/buy` checkout to one amount-and-asset field with one contextual action, while replacing the Xverse-only Bitcoin path with Reown AppKit Bitcoin multi-wallet support.

**Architecture:** Keep the backend-prepared wallet transaction lifecycle and the existing ETH, SOL, and TRON execution adapters. Add one route-local AppKit Bitcoin boundary that exposes connection state, the Bitcoin provider, selector opening, transfer submission, and disconnect. Make the payment card own all pre-transaction UX; reserve the dialog for active transaction progress, post-broadcast tracking, and recoverable transaction errors.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Radix Select/Dialog, Reown AppKit `1.8.22`, Account Kit/Wagmi, MetaMask Solana adapter, TronLink adapter, TanStack Query.

---

## Task 1: Add explicit Reown Bitcoin dependencies

**Files:**

- Modify: `fe/package.json`
- Modify: `fe/package-lock.json`

- [ ] **Step 1: Confirm the old Bitcoin dependency has no other consumers**

Run from the repository root:

```bash
rg -n "sats-connect|xverse-checkout-wallet-adapter" fe --glob '!package-lock.json'
```

Expected: only the Xverse adapter, checkout controller, and `fe/package.json` appear.

- [ ] **Step 2: Install the direct AppKit dependencies and remove the Xverse-only dependency**

Run from `fe/`:

```bash
npm install @reown/appkit@1.8.22 @reown/appkit-adapter-bitcoin@1.8.22
npm uninstall sats-connect
```

Expected: `package.json` lists both Reown packages as direct dependencies, removes `sats-connect`, and the lockfile resolves a single compatible AppKit version where possible.

- [ ] **Step 3: Check package metadata without staging**

```bash
npm ls @reown/appkit @reown/appkit-adapter-bitcoin sats-connect
git diff --check -- package.json package-lock.json
```

Expected: both AppKit packages resolve successfully, `sats-connect` is absent, and diff check is clean.

## Task 2: Create the route-local AppKit Bitcoin provider boundary

**Files:**

- Create: `fe/src/app/(marketing)/buy/wallet-adapters/bitcoin-appkit-checkout-wallet.ts`
- Delete: `fe/src/app/(marketing)/buy/wallet-adapters/xverse-checkout-wallet-adapter.ts`

- [ ] **Step 1: Initialize AppKit once for Bitcoin mainnet**

Create a client-only module that reads `Env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, creates `BitcoinAdapter`, and calls `createAppKit` outside the hook with:

```ts
createAppKit({
  adapters: [bitcoinAdapter],
  networks: [bitcoin],
  projectId,
  metadata: {
    name: 'FlowDex',
    description: 'FlowDex Protocol',
    url: Env.NEXT_PUBLIC_APP_URL ?? 'https://flowdexprotocol.com',
    icons: [`${appUrl}/favicon.ico`],
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
    onramp: false,
    swaps: false,
  },
})
```

Use the package's installed types as the authority if an option name differs. Do not initialize EVM, Solana, or TRON adapters in AppKit.

- [ ] **Step 2: Expose only the Bitcoin operations checkout needs**

Implement a hook using:

```ts
useAppKit()
useAppKitAccount({ namespace: 'bip122' })
useAppKitProvider<BitcoinConnector>('bip122')
useDisconnect()
useWalletInfo()
```

Return:

```ts
{
  address,
  connectorName,
  isConnected,
  isConnecting,
  isReady,
  openSelector: () => open({ view: 'Connect', namespace: 'bip122' }),
  disconnect: () => disconnect({ namespace: 'bip122' }),
  sendPreparedAction,
}
```

`isReady` must require a Bitcoin address and a provider exposing `sendTransfer`.

- [ ] **Step 3: Send only the backend-prepared Bitcoin transfer**

Implement `sendPreparedAction` so the provider receives the exact immutable values:

```ts
const txId = await walletProvider.sendTransfer({
  recipient: action.recipientAddress,
  amount: action.amountSats,
})
```

Return the existing `WalletTxResult` contract. Reject missing addresses, missing provider capability, invalid positive satoshi strings, and empty transaction ids before returning.

- [ ] **Step 4: Remove the Xverse-only adapter and run a focused type check**

Delete `xverse-checkout-wallet-adapter.ts`, then run:

```bash
npx eslint 'src/app/(marketing)/buy/wallet-adapters/bitcoin-appkit-checkout-wallet.ts'
npm run check:types
```

Expected: no references to `sats-connect` or the Xverse adapter remain in the new provider boundary; types pass after any current package-API adjustments.

## Task 3: Make the checkout controller connection-aware

**Files:**

- Modify: `fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- Modify: `fe/src/app/(marketing)/buy/types/buy-view-model.ts`
- Modify: `fe/src/app/(marketing)/buy/core/checkout-machine.ts`

- [ ] **Step 1: Replace Xverse local state with the AppKit Bitcoin hook**

Remove Xverse state, refs, adapter construction, provider detection, and connector naming. Consume the new Bitcoin boundary and map it into `BuyWalletStatusView` using the connected AppKit address, wallet label, and transfer readiness.

Use `availableConnectorNames: ['walletconnect']` for the provider-managed Bitcoin surface instead of enumerating installed extensions in FlowDex. AppKit owns actual wallet discovery.

- [ ] **Step 2: Add the contextual primary-action view model**

Add explicit presentation fields rather than duplicating conditional logic in JSX:

```ts
type BuyOrderView = {
  // existing fields
  primaryActionLabel: string;
  isPrimaryActionBusy: boolean;
};
```

Derive the label from lifecycle and wallet state:

```text
disconnected -> Connect wallet
wrong network -> Switch network
connected idle/ready/failed-before-broadcast -> Buy <amount> $FDN
preparing -> Preparing transaction
approval -> Confirm in your wallet
submitting -> Recording transaction
```

`canSubmit` continues to validate order input. Button enablement must separately allow connection when the amount is valid and block duplicate transaction work while busy.

- [ ] **Step 3: Make `buy()` the single contextual action**

Update `actions.buy()` to:

1. Resume an existing submitted transaction before any new work.
2. Switch a wrong network.
3. If disconnected, start only the selected chain's connection flow and return.
4. If connected and ready, call `startWalletPayment()`.

Connection behavior:

- BTC: `open({ view: 'Connect', namespace: 'bip122' })`.
- ETH: open the existing Account Kit auth modal.
- SOL: invoke the existing MetaMask Solana connection.
- TRON: invoke the existing TronLink connection.

Do not create a payment intent in the same action that initiates wallet connection. The wallet-ready effect returns checkout to the form.

- [ ] **Step 4: Keep transaction rejection usable**

When connection or approval fails before a tx id exists, preserve the connected wallet and amount. The primary action should return to `Connect wallet` or `Buy ...` rather than requiring a special connector-review dialog.

Keep submitted-tx recovery unchanged: an existing `checkout.session + checkout.txResult` retries result submission and never sends again.

- [ ] **Step 5: Remove obsolete action surface**

Remove `connectWallet`, `verifyWallet`, and `startWalletPayment` from `BuyActions` once no component calls them. Retain `disconnectWallet`, `switchNetwork`, `closeCheckout`, and `startNewPayment` only where used.

- [ ] **Step 6: Validate controller and state changes**

```bash
npx eslint 'src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts' \
  'src/app/(marketing)/buy/types/buy-view-model.ts' \
  'src/app/(marketing)/buy/core/checkout-machine.ts'
npm run check:types
```

Expected: no Xverse imports, no unhandled promise lint violations, and full type consistency.

## Task 4: Replace the currency grid with one amount-and-asset field

**Files:**

- Modify: `fe/src/app/(marketing)/buy/_components/payment-card.tsx`
- Modify: `fe/src/app/(marketing)/buy/_components/buy-page-client.tsx`

- [ ] **Step 1: Render the amount and asset selector as one field group**

Use the existing Radix Select wrapper from `@/components/ui/select` inside the amount field. The field should have:

- `You pay` label;
- editable decimal amount on the left;
- selected asset icon, code, and dropdown affordance on the right;
- only `order.supportedAssets` as options.

Remove the standalone `Select Currency` grid and `Custom Amount` label.

- [ ] **Step 2: Keep the receive and value context compact**

Render `You receive` as a distinct read-only panel directly below the pay field. Keep listing value and potential ROI as two compact rows. Do not duplicate the same order summary in a modal.

- [ ] **Step 3: Add a compact connected-wallet row**

Pass `wallet` into `PaymentCard`. When connected, show the connector label, truncated selected-chain address, and a small `Change` or `Disconnect` action. Do not expose chain/device selection or raw connector diagnostics.

When disconnected or unsupported, show a short inline reason below the field; AppKit remains responsible for the Bitcoin wallet catalog.

- [ ] **Step 4: Render the one contextual CTA**

The full-width CTA calls `actions.buy()` for connect, switch, and buy states. Use `order.primaryActionLabel` and `order.isPrimaryActionBusy`. Progress states show the existing spinner.

- [ ] **Step 5: Validate the form components**

```bash
npx eslint 'src/app/(marketing)/buy/_components/payment-card.tsx' \
  'src/app/(marketing)/buy/_components/buy-page-client.tsx'
npm run check:types
```

Expected: form types pass; no unsupported asset can be selected because all options come from backend capabilities.

## Task 5: Reduce payment dialogs to transaction lifecycle UI

**Files:**

- Modify: `fe/src/app/(marketing)/buy/_components/payment-dialogs.tsx`

- [ ] **Step 1: Remove pre-transaction wallet UI**

Delete `WalletConnectorPicker`, `ConnectedWalletPanel`, connector-label mapping used only by those components, and the modal `OrderSummary`.

- [ ] **Step 2: Open the dialog only for material transaction states**

The dialog should open for:

```text
preparing_wallet_action
waiting_for_wallet_approval
submitting_tx_result
tracking
failed only when an intent or tx-result recovery context exists
```

It must remain closed for `closed`, `connecting_wallet`, and `wallet_ready`, because connection is handled by the provider surface and the form.

- [ ] **Step 3: Preserve progress, tracking, and recovery**

Keep transaction-stage messaging, tx id/payment-intent display, status polling feedback, `Buy again`, and recoverable retry behavior. Keep the wallet as the final transaction review surface.

- [ ] **Step 4: Validate the simplified dialog**

```bash
npx eslint 'src/app/(marketing)/buy/_components/payment-dialogs.tsx'
npm run check:types
```

Expected: no connector picker or duplicate order summary remains, while tracking/recovery types still pass.

## Task 6: Full verification and worktree review

**Files:**

- Verify all files changed in Tasks 1-5
- Verify: `docs/superpowers/specs/2026-07-14-desktop-wallet-selector-checkout-design.md`
- Verify: `docs/superpowers/plans/2026-07-14-desktop-wallet-selector-checkout.md`

This frontend currently has no unit-test runner or `*.test.*` / `*.spec.*` suite. Do not reintroduce Vitest or Playwright solely for this checkout change. Use TypeScript, ESLint, dependency analysis, production build, and desktop browser verification as the repository's available gates.

- [ ] **Step 1: Search for obsolete and prohibited paths**

```bash
rg -n "sats-connect|xverse-checkout-wallet-adapter|Continue with wallet|Select Currency|Custom Amount" fe/src fe/package.json
rg -n "direct.send|manual address|paymentUri|qrValue" 'fe/src/app/(marketing)/buy'
```

Expected: first command has no obsolete checkout matches. Any `paymentUri`/`qrValue` data types retained for backend response compatibility must not render a manual/direct-send fallback.

- [ ] **Step 2: Run full frontend gates**

From `fe/`:

```bash
npm run check:types
npm run lint
npm run check:deps
npm run build:next
```

Expected: all four commands exit successfully.

- [ ] **Step 3: Run desktop browser verification when local runtime configuration is available**

Verify on `/buy`:

1. The amount and asset selector appear as one field.
2. Disconnected BTC opens AppKit directly in the Bitcoin wallet view.
3. Closing or completing connection keeps the form amount and does not create an intent.
4. Connected BTC shows wallet identity and enables explicit `Buy`.
5. AppKit offers detected compatible Bitcoin wallets and WalletConnect QR without email/social/onramp UI.
6. ETH uses Account Kit, SOL uses MetaMask Solana, and TRON uses TronLink when backend-enabled.
7. Rejection returns to a usable form.
8. A submitted tx enters tracking and refresh does not prompt another send.

Do not send a real production transaction during verification.

- [ ] **Step 4: Review the final diff without staging**

```bash
git diff --check
git status --short
git diff --stat
git diff -- 'fe/src/app/(marketing)/buy' fe/package.json fe/package-lock.json
```

Expected: no whitespace errors; unrelated existing changes remain untouched; no files are staged.

