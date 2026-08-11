# Multi-wallet TRON checkout implementation plan

**Goal:** Replace the TronLink-only USDT-TRC20 checkout with one Reown selector supporting TronLink, OKX, Trust Wallet, and MetaMask TRON while preserving backend-owned payment parameters and wallet-only checkout.

**Architecture:** A single route-local Reown AppKit instance owns Bitcoin and TRON. For TRC-20, the backend creates and stores the unsigned Alchemy transaction; the selected wallet signs it; a protected backend endpoint validates and broadcasts it; the existing tx-result/reconciliation path tracks confirmation.

**Working-tree rule:** Preserve all existing modifications, deletions, and dependency cleanup as intentional. Do not stage or commit.

## Task 1: Add compatible Reown TRON adapters

- Install the exact AppKit 1.8.22-compatible TRON adapter and the four approved wallet adapter packages.
- Inspect the installed type declarations and exports used by the implementation.
- Do not upgrade the existing AppKit/Bitcoin packages.

## Task 2: Prepare and broadcast TRC-20 transactions on the backend

Files:

- `be/src/modules/alchemy/alchemy.service.ts`
- `be/src/modules/payments/services/tron-payment-execution.service.ts`
- `be/src/modules/payments/wallet-action-executors/tron-wallet-action.executor.ts`
- `be/src/modules/payments/dto/payments.dto.ts`
- `be/src/modules/payments/payments.controller.ts`
- `be/src/modules/payments/payments.service.ts`

Steps:

- Add typed Alchemy methods for `triggersmartcontract` and `broadcasttransaction`.
- Encode the USDT recipient and amount parameters and validate Alchemy's unsigned transaction response.
- Persist the unsigned transaction in the prepared action and expose the safe transaction fields to the frontend.
- Add a signed-transaction DTO and protected TRON broadcast endpoint.
- Validate signature presence and immutable transaction equality before broadcasting.
- Make broadcast retry-safe and return a validated txid.
- Update checkout capability copy from a single `tronlink` provider to multi-wallet `reown`.

## Task 3: Consolidate Reown AppKit and add the TRON hook

Files:

- Create `fe/src/app/(marketing)/buy/wallet-adapters/reown-checkout-appkit.ts`
- Create `fe/src/app/(marketing)/buy/wallet-adapters/tron-appkit-checkout-wallet.ts`
- Modify `fe/src/app/(marketing)/buy/wallet-adapters/bitcoin-appkit-checkout-wallet.ts`
- Modify `fe/src/app/(marketing)/buy/types/checkout-wallet.types.ts`
- Modify `fe/src/dal/app/payments/payments.services.ts`

Steps:

- Move module-scope `createAppKit` into the shared route-local singleton.
- Register Bitcoin plus the four approved TRON adapters and mainnet networks.
- Keep BTC namespace behavior unchanged.
- Implement TRON connect/disconnect state and dynamic wallet labels.
- Sign only the backend-prepared unsigned transaction, submit it to the broadcast endpoint, and return the txid to the checkout machine.
- Reject unsupported TRON WalletConnect sessions explicitly in this release.

## Task 4: Replace the controller's TronLink-only state

Files:

- `fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- `fe/src/app/(marketing)/buy/utils/supported-asset-options.ts`
- Delete when unused: `fe/src/app/(marketing)/buy/wallet-adapters/tronlink-checkout-wallet-adapter.ts`
- Delete when unused: `fe/src/app/(marketing)/buy/constants/tronlink.ts`

Steps:

- Replace custom discovery/listener/ref state with the TRON AppKit hook.
- Pass the current checkout token and prepared action id through the protected broadcast call.
- Use the selected wallet name in the view model instead of hard-coded TronLink.
- Remove the immediate missing-TronLink error and leave the wallet selector as the connection UI.
- Keep direct-send and custom mobile flows absent.

## Task 5: Tests and verification

- Add focused backend tests for preparation, mismatch rejection, broadcast success, and idempotency.
- Run `git diff --check` and search for conflict markers.
- Run targeted backend Jest tests and backend type checking/build.
- Run scoped frontend ESLint, frontend type checking, and `npm run build:next`.
- Start the app and verify in-browser that TRON opens the Reown selector without the old toast; recheck BTC WalletConnect and ETH Account Kit rendering.
- Report any production environment prerequisites without changing production configuration.
