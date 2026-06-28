# Buy Page Crash Course

This is the onboarding path for a developer who needs to work on the FlowDex `/buy` page immediately. The goal is to understand the page, the transaction flows behind it, and the files that are safe to edit first.

## First Mental Model

The buy page has two transaction paths:

1. Direct-send checkout
   - Used for manual payment instructions and non-wallet rails.
   - Creates a public payment intent.
   - Shows exact amount, receiver address, QR code, expiry, and status.
   - Backend detects and reconciles payment through scanner/webhook logic.

2. Wallet checkout
   - Used for EVM assets with a connected browser wallet.
   - Requires a verified wallet session.
   - Calls the authenticated transaction simulation endpoint.
   - Sends the backend-provided RPC transaction with provider-managed `eth_sendTransaction`.
   - Tracks the returned `txHash` as a ledger transaction.

These flows are intentionally separate. Public payment intents live in the payments module. Wallet checkout receipts live in the transactions module.

## Local Setup

Backend:

```bash
cd be
npm install
npm run infra:up
npm run dev:setup
npm run start:dev
```

Frontend:

```bash
cd fe
npm install
npm run auth:migrate
npm run dev
```

Default local ports:

- Backend API: `http://localhost:3002/api`
- Frontend: `http://localhost:3003`

Important env names:

- `be/.env.local`: `DATABASE_URL`, `INTERNAL_AUTH_JWT_SECRET`, `INTERNAL_AUTH_ISSUER`, `INTERNAL_AUTH_AUDIENCE`, treasury addresses, Alchemy config.
- `fe/.env.local`: `DATABASE_URL`, matching internal auth JWT settings, `NEXT_PUBLIC_API_URL`, public Alchemy key, public treasury display config.

The BFF and backend must share the same internal JWT secret, issuer, and audience.

## Architecture Map

Buy route:

- `src/app/(marketing)/buy/page.tsx`
  - Client route entrypoint.
  - Composes the buy page layout.
  - Calls `useBuyCheckoutController()`.

- `src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
  - Main state machine and side-effect coordinator.
  - Builds market/order/payment/wallet view models.
  - Creates direct payment intents.
  - Verifies wallet sessions.
  - Simulates wallet transactions.
  - Sends wallet transactions.
  - Starts backend transaction tracking.

- `src/app/(marketing)/buy/types/buy-view-model.ts`
  - Route-local view-model types for the page, dialogs, wallet state, and actions.

- `src/app/(marketing)/buy/_components/payment-card.tsx`
  - Amount input, asset selection, order summary, and buy CTA.

- `src/app/(marketing)/buy/_components/payment-dialogs.tsx`
  - Checkout modal stages.
  - Shows wallet connector choice, direct address capture, direct instructions, failure state, and wallet tracking state.

- `src/app/(marketing)/buy/_components/wallet-connection-status.tsx`
  - Connected wallet status surface outside the modal.

- `src/app/(marketing)/buy/_components/portfolio-panel.tsx`
  - Public portfolio lookup for the connected wallet address.

Buy route utilities:

- `utils/get-buy-execution-readiness.ts`
  - Decides whether the connected wallet can use checkout.
  - Supports MetaMask, Coinbase Wallet, and WalletConnect only when the connected session proves support.

- `utils/walletconnect-session-capabilities.ts`
  - Reads WalletConnect approved namespaces, methods, accounts, and chain capability.

- `utils/buy-transaction-validation.ts`
  - Validates backend simulation RPC fields.
  - Ensures active wallet, verified wallet, and simulation chain still match.
  - Builds the exact `eth_sendTransaction` payload.

- `utils/send-buy-transaction.ts`
  - Re-reads wallet account and chain immediately before send.
  - Calls `provider.request({ method: 'eth_sendTransaction', ... })`.
  - Normalizes send failures.

- `utils/normalize-provider-error.ts`
  - Maps provider failures into typed reasons such as user rejection, wrong chain, unsupported method, insufficient funds, and RPC errors.

- `utils/supported-asset-options.ts`
  - Builds the selectable payment assets from live market/presale data.

Shared wallet plumbing:

- `src/hooks/use-marketing-wallet-sync.ts`
  - Bridges Account Kit/wagmi state into the FlowDex wallet store.
  - Connects by connector name.
  - Auto-hydrates authorized injected wallets.
  - Creates and verifies wallet signatures.
  - Clears checkout lifecycle state on wallet changes.

- `src/hooks/use-marketing-wallet-store.ts`
  - Zustand store for provider state, verification state, and checkout lifecycle metadata.

- `src/hooks/marketing-wallet.types.ts`
  - Shared wallet state and reason types.

DAL and routes:

- `src/api-routes.ts`
  - Only place frontend/BFF/backend endpoint strings should be added.

- `src/dal/app/payments/payments.services.ts`
  - Public payment intent, status, history, leaders, and portfolio requests.

- `src/dal/app/payments/payments.types.ts`
  - Frontend DTOs for public payments.

- `src/dal/app/transactions/transactions.services.ts`
  - Authenticated wallet transaction simulation, tracking, list, and detail requests.

- `src/dal/app/transactions/transactions.types.ts`
  - Frontend DTOs for wallet transaction simulation and ledger items.

- `src/dal/app/wallet-auth/wallet-auth.services.ts`
  - Wallet challenge, verify, session, and logout requests.

Next.js API/BFF layer:

- `src/app/api/public/[...path]/route.ts`
  - Public proxy to backend endpoints. Used by payment intent/status/history/portfolio/leaders and public market reads.

- `src/app/api/bff/[...path]/route.ts`
  - Authenticated proxy to backend endpoints.
  - For `/transactions/*`, it requires a wallet session cookie and mints an internal wallet JWT.
  - For `/admin/*` and `/auth/*`, it uses the Better Auth app session.

- `src/app/api/wallet-auth/*`
  - Frontend-owned wallet challenge/session endpoints.
  - Uses the frontend database schema for wallet auth sessions.

Backend:

- `be/src/modules/payments/*`
  - Direct-send public payment intents, status polling, portfolio, leaders, scanners, and Alchemy payment webhooks.

- `be/src/modules/transactions/*`
  - Wallet-authenticated simulation, transaction tracking, user ledger reads, admin ledger reads, and reconciliation.

- `be/src/modules/alchemy/alchemy.service.ts`
  - Alchemy RPC, simulation, transaction lookup, receipt lookup, and webhook verification integration.

## `/buy` Data Flow

On page load:

```text
useBuyCheckoutController
-> usePricing()
-> usePresaleStats()
-> usePresaleTiers()
-> usePresaleConfig()
-> buildBuyMarketModel(snapshot)
-> buildSupportedAssetOptions(snapshot)
-> page receives market/order/payment/wallet/actions view models
```

The page does not fetch directly. Data access stays in DAL service files.

## Direct-Send Checkout Flow

This is the manual payment-intent flow.

```text
User enters amount and selects asset
-> clicks Buy
-> openCheckout()
-> if wallet checkout is unavailable, stage = direct_address
-> user enters payment wallet address
-> createDirectPayment()
-> useCreatePaymentIntent()
-> POST /api/public/payments/intents
-> proxy to backend POST /payments/intents
-> PaymentsService.createIntent()
-> backend quotes expected amount and creates payment_intents row
-> frontend stores active intent in sessionStorage
-> stage = direct_instructions
-> frontend displays exact amount, receiver address, QR, expiry
-> frontend polls GET /api/public/payments/intents/:id/status every 12s
-> backend checks scanner/webhook state and returns intent + payment
-> terminal status stops polling
```

Important files:

- Frontend coordinator: `src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- Direct instructions UI: `src/app/(marketing)/buy/_components/payment-dialogs.tsx`
- Intent persistence: `src/app/(marketing)/buy/utils/buy-payment-storage.ts`
- Payment DAL: `src/dal/app/payments/payments.services.ts`
- Backend controller: `be/src/modules/payments/payments.controller.ts`
- Backend service: `be/src/modules/payments/payments.service.ts`
- Scanner: `be/src/modules/payments/payments.scanner.ts`

Direct-send state records:

- `payment_intents`: expected asset, amount, sender address, receiver address, expiry, status.
- `payments`: matched on-chain payment record, tx hash, confirmations, status.

Direct-send statuses:

- Intent: `WAITING`, `DETECTED`, `CONFIRMING`, `CONFIRMED`, `EXPIRED`, `FAILED`, `UNDERPAID`, `OVERPAID`, `LATE_PAID`
- Payment: `DETECTED`, `CONFIRMING`, `CONFIRMED`, `FAILED`, `UNDERPAID`, `OVERPAID`, `LATE_PAID`

## Wallet Checkout Flow

This is the provider-send flow.

```text
User enters amount and selects EVM asset
-> clicks Buy
-> stage = choose_method
-> user connects wallet
-> useMarketingWalletSync updates provider state
-> getBuyExecutionReadiness() checks connector/provider/session capability
-> user continues with wallet
-> verifyConnectedWallet() or submitWalletPayment() verifies wallet session
-> POST /api/wallet-auth/challenge
-> wallet signs challenge message
-> POST /api/wallet-auth/verify
-> frontend receives wallet session cookie
-> submitWalletPayment()
-> re-check readiness
-> parse amount into base units
-> useSimulateTransaction()
-> POST /api/bff/transactions/simulate
-> BFF mints wallet JWT and proxies to backend POST /transactions/simulate
-> backend verifies wallet auth, builds exact request, calls Alchemy simulation
-> backend saves simulation_intents row
-> backend returns simulationId + request
-> sendBuyTransaction()
-> re-read eth_accounts and eth_chainId
-> assertSimulationMatchesWallet()
-> provider.request({ method: 'eth_sendTransaction', params: [request] })
-> wallet returns txHash
-> useTrackTransaction()
-> POST /api/bff/transactions/track
-> backend verifies tx hash, sender, recipient, amount, token contract/logs
-> backend marks simulation intent used
-> backend writes ledger_transactions row
-> frontend shows txHash and receipt publicId
```

Important files:

- Checkout coordinator: `src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- Readiness gate: `src/app/(marketing)/buy/utils/get-buy-execution-readiness.ts`
- WalletConnect capability gate: `src/app/(marketing)/buy/utils/walletconnect-session-capabilities.ts`
- Simulation validation: `src/app/(marketing)/buy/utils/buy-transaction-validation.ts`
- Wallet send: `src/app/(marketing)/buy/utils/send-buy-transaction.ts`
- Transaction DAL: `src/dal/app/transactions/transactions.services.ts`
- BFF proxy: `src/lib/auth-server.ts`
- Wallet auth server helpers: `src/lib/wallet-auth.server.ts`
- Backend transaction service: `be/src/modules/transactions/transactions.service.ts`

Wallet checkout state records:

- `wallet_auth_challenges`: frontend-owned challenge records for wallet verification.
- `wallet_auth_sessions`: frontend-owned session records stored behind the `flowdex_wallet_session` cookie.
- `simulation_intents`: backend records of simulated, wallet-bound transaction terms.
- `ledger_transactions`: backend records of submitted and verified wallet transactions.

## Wallet Readiness Rules

Injected wallet checkout can proceed only when:

- The connector is one of the supported injected connectors currently surfaced on `/buy`.
- A connected account exists.
- The active chain is known.
- The active chain equals the selected asset chain.
- The provider exposes an EIP-1193-style `request`.

WalletConnect checkout can proceed only when the connected session proves:

- It has an `eip155` namespace.
- It approved `eth_sendTransaction`.
- It approved the active account and active chain.
- It can use the required chain, or it exposes enough switch capability for the route to keep checking readiness.

If WalletConnect metadata is missing or inconclusive, the route must block checkout. Do not "try anyway". The final send path still re-reads `eth_chainId` and blocks if the wallet is not actually on the simulation chain.

## Hard Transaction Invariants

Do not break these:

- The default `/buy` wallet send path must use provider-managed `eth_sendTransaction`.
- Do not use raw signed transactions in the default `/buy` flow.
- Do not call `signer.signTransaction`.
- Do not call `sendRawTransaction`.
- Do not reconstruct `to`, `value`, `data`, or gas fields from UI state.
- Use the backend simulation `request` verbatim after validation.
- Re-read wallet account and chain immediately before send.
- Block if the connected account no longer equals the verified wallet.
- Block if the active chain no longer equals `request.chainId`.
- Treat simulation failure, send failure, and receipt tracking failure as different problems.
- User rejection is not wallet incompatibility.

The transaction object sent to the provider is built only from the verified wallet and backend simulation:

```ts
{
  from: connectedAddress,
  to: request.to,
  value: request.value,
  data: request.data,
  ...(request.gas ? { gas: request.gas } : {}),
  ...(request.gasPrice ? { gasPrice: request.gasPrice } : {}),
  ...(request.maxFeePerGas ? { maxFeePerGas: request.maxFeePerGas } : {}),
  ...(request.maxPriorityFeePerGas ? { maxPriorityFeePerGas: request.maxPriorityFeePerGas } : {}),
}
```

## BFF/Auth Rules

There are three relevant frontend server paths:

- `/api/public/*`
  - No app session or wallet session required.
  - Proxies to backend public endpoints.

- `/api/bff/transactions/*`
  - Requires the `flowdex_wallet_session` cookie.
  - Mints an internal wallet JWT.
  - Backend sees `authType = wallet`.

- `/api/bff/admin/*` and `/api/bff/auth/*`
  - Requires Better Auth session.
  - Mints an internal admin/app JWT.

Do not call backend transaction endpoints directly from components. Use the DAL hooks and BFF routes.

## Backend Process Details

Direct payments:

- `PaymentsService.createIntent()` validates chain/asset, normalizes sender address, quotes the requested token amount, and creates `payment_intents`.
- Ethereum direct payments require `senderAddress`.
- `getIntentStatus()` returns cached status when allowed, otherwise checks and persists current chain status.
- `processEthereumAlchemyWebhook()` verifies Alchemy webhook signatures and processes matching transfers.
- `scanOpenIntents()` periodically checks open intents.
- Portfolio and leaders read from confirmed or intent-linked payment records.

Wallet transactions:

- `TransactionsService.simulate()` requires wallet auth, maps chain ID to network, resolves treasury, builds the exact native or ERC-20 transaction request, calls Alchemy simulation, then stores `simulation_intents`.
- `TransactionsService.track()` requires wallet auth, validates the submitted hash, loads the matching simulation intent, prevents duplicate cross-wallet claims, fetches transaction and receipt from Alchemy, verifies sender/recipient/amount, marks the simulation used, and writes `ledger_transactions`.
- `reconcileById()` lets admin re-check a ledger transaction against current chain data.

## Where To Make Common Changes

Add or change buy-page UI:

- Start in `src/app/(marketing)/buy/page.tsx`.
- Route-specific components belong in `src/app/(marketing)/buy/_components`.
- Route-specific types belong in `src/app/(marketing)/buy/types`.

Change checkout stages or user actions:

- Start in `src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`.
- Update `BuyCheckoutStage` and `BuyActions` in `types/buy-view-model.ts`.
- Update stage rendering in `payment-dialogs.tsx`.
- Add focused tests in `utils/buy-checkout-flow.test.ts` or a new route-local test.

Change public payment data:

- Frontend DTOs and hooks: `src/dal/app/payments/*`
- Backend DTO/controller/service: `be/src/modules/payments/*`

Change wallet simulation/tracking:

- Frontend DTOs and hooks: `src/dal/app/transactions/*`
- Backend DTO/controller/service: `be/src/modules/transactions/*`
- Be very cautious with transaction validation and send invariants.

Change wallet connection/verification:

- `src/hooks/use-marketing-wallet-sync.ts`
- `src/hooks/use-marketing-wallet-store.ts`
- `src/lib/wallet-auth.server.ts`
- `src/app/api/wallet-auth/*`

Add a new endpoint:

- Add the route to `src/api-routes.ts` first.
- Add DAL service/types next.
- Components should consume DAL hooks, not Axios/fetch.

## Development Rules For This App

- Keep route-local buy code under `src/app/(marketing)/buy`.
- Do not move buy-only helpers into shared folders unless another real route uses them.
- Internal navigation goes through `src/routes.ts`.
- Backend/BFF endpoint strings go through `src/api-routes.ts`.
- Backend DTOs live in DAL `*.types.ts` and use `I<TypeName>` naming.
- App feature icons import from `src/icons.ts`.
- React Query hooks live in matching DAL `*.services.ts` files.
- Mutation callbacks own cache invalidation and user-facing toasts.
- Components do not make raw backend requests.

## Suggested First Tasks

Good first tasks:

- Add tests for a checkout stage transition.
- Improve copy for one normalized provider error reason.
- Add a missing loading or empty state in a buy-page panel.
- Add a display-only metric from existing market or payment DTOs.
- Add a portfolio formatting test.

Tasks that require extra review:

- Changing simulation request shape.
- Changing WalletConnect readiness.
- Adding a new wallet connector.
- Changing payment status transitions.
- Changing treasury or network mapping.
- Changing transaction verification logic.

## Verification Checklist

Frontend:

```bash
cd fe
npm run check:types
npx eslint src/app/'(marketing)'/buy src/dal/app/payments src/dal/app/transactions src/hooks/use-marketing-wallet-sync.ts src/hooks/use-marketing-wallet-store.ts
npm run test
```

Backend:

```bash
cd be
npm run test -- payments.service.spec.ts
npm run test
```

Manual smoke path:

1. Start backend and frontend.
2. Open `/buy`.
3. Confirm pricing/tier data renders.
4. Select ETH or another EVM asset and enter amount.
5. Open checkout.
6. Verify connector list renders.
7. Connect wallet on the expected chain.
8. Verify wallet signature.
9. Run wallet checkout on testnet only.
10. Confirm tx hash appears and a receipt public ID is shown or tracking state is visible.
11. Test direct-send fallback and status polling.
12. Check portfolio and leaders still load.

## Quick Debug Guide

No supported assets:

- Check pricing and presale DAL requests.
- Check backend public proxy `/api/public/*`.
- Check `buildSupportedAssetOptions(snapshot)`.

Wallet connects but cannot checkout:

- Check `walletStatus.executionReadiness`.
- Check `unsupportedReason`.
- Check connector name normalization.
- For WalletConnect, inspect approved `session.namespaces.eip155`.

Wallet verification fails:

- Check trusted origin config.
- Check `flowdex_wallet_session` cookie.
- Check frontend database wallet auth tables.
- Check challenge expiry and signature address.

Simulation fails:

- Check backend Alchemy API key.
- Check selected chain maps to a supported network.
- Check treasury address is configured and not a reserved/system address.
- Check amount base units are positive.

Send fails:

- Check account and chain did not change after simulation.
- Check wallet has enough funds for contribution and gas.
- Check provider supports `eth_sendTransaction`.
- Check normalized provider error reason.

Track fails:

- Check `txHash` exists on the selected chain.
- Check sender equals wallet session.
- Check recipient equals treasury.
- Check native value or ERC-20 transfer amount equals simulation amount.
- Check simulation intent has not expired or already been used.
