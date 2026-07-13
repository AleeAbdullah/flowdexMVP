# Bitcoin and Tron Wallet Checkout Design

Date: 2026-07-13

## Summary

FlowDex `/buy` will become wallet-only. Bitcoin checkout will support Xverse on Bitcoin mainnet. Tron checkout will support USDT on TRC-20 through TronLink on Tron mainnet. Manual wallet-address entry, QR/copy-paste instructions, direct-send states, and direct-send fallbacks will be removed for every asset.

The implementation will introduce a small route-local wallet-checkout core with one explicit state machine. Wallet adapters will only connect to their provider, expose the selected account/network, and execute an immutable backend-prepared transfer. The backend will own the recipient, amount, network, asset/contract, action lifetime, transaction recording, reconciliation, and confirmation decision.

## Goals

- Provide Xverse-only BTC wallet checkout using Sats Connect.
- Provide TronLink-only USDT-TRC20 wallet checkout using the recommended `window.tron` provider.
- Remove direct-send UX and code completely, including hidden fallbacks.
- Keep transaction approval inside the user's wallet.
- Treat broadcast and payment confirmation as separate states.
- Make transaction submission idempotent and resilient to provider-indexing delay.
- Reuse existing server-side pricing, BTC address derivation, payment persistence, and admin visibility only after correcting audited lifecycle defects.
- Keep checkout logic local to `fe/src/app/(marketing)/buy`.

## Non-goals

- Native TRX payments.
- Bitcoin wallets other than Xverse.
- Bitcoin wallet login or Bitcoin-based application authentication.
- PSBT construction by FlowDex; Xverse owns input selection, fees, signing, and broadcast.
- Replacing the existing ETH or SOL wallet integrations beyond removing their direct-send fallback and fitting them into the same state-machine boundary.
- A generic cross-application wallet framework.
- A third-party custodial payment processor.

## Existing Foundation Audit

### Keep

- `PaymentPricingService` as the source of server-side quotes and base-unit amounts.
- `BtcAddressService` account-level xpub parsing and native-SegWit address derivation.
- The BTC advisory lock, derivation index, derivation path, unique receive-address index, and unique derivation-index index.
- `payment_intents`, `payment_wallet_actions`, and `payments` as the lifecycle records.
- Exact base-unit storage and the shared payment/admin reporting path.
- Chain-specific wallet-action executors as the backend extension point, after duplicate guards are consolidated.
- Confirmation thresholds from backend configuration.

### Replace or correct

- The frontend controller currently mixes view-model calculation, connection, authentication, wallet execution, direct-send execution, persistence, polling, and errors. It will be reduced to composition over a checkout core.
- `direct_address`, `direct_instructions`, `useDirectSend`, `createDirectPayment`, payment URIs, manual sender input, and direct-send UI will be removed from `/buy`.
- BTC is hard-coded as frontend-enabled while backend availability is controlled separately. A backend capabilities response will become the source of truth for enabled checkout methods.
- BTC has no wallet-action kind, executor, or transaction-id kind. Those will be added.
- Tron submission currently tries to fetch and reconcile the transaction immediately. A valid broadcast can fail checkout simply because the provider has not indexed the txid yet. Submission will record the txid and reconciliation will be asynchronous.
- `GET /payments/intents/:id/status` currently performs provider work. It will become a database read; the background reconciler will own provider calls.
- The scanner currently allows one provider error to abort a batch. Each intent/action will be isolated with retry metadata and backoff.
- The current lifecycle expires an intent before checking for a broadcast payment, making `LATE_PAID` effectively unreachable in important cases. Submitted actions will be checked before expiry, and late-payment recovery will have an explicit grace window.
- Tron block scanning repeatedly starts from the intent's creation block. Submitted txids will be reconciled directly; bounded scanning remains only as a recovery path.
- Wallet-action guards duplicated in `PaymentsService` and executor helpers will have one owner.
- The installed frontend baseline currently fails validation after the cleanup. A clean dependency install and repair of the cleanup regressions are required before feature implementation is considered valid.

## Frontend Architecture

### Checkout state machine

Use a discriminated union and reducer/transition function. No collection of loosely related booleans may determine the lifecycle.

States:

1. `idle`
2. `connecting_wallet`
3. `creating_intent`
4. `preparing_action`
5. `awaiting_wallet_approval`
6. `submitting_txid`
7. `tracking`
8. `confirmed`
9. `failed`

`failed` carries the failed step, normalized error code, user-safe message, retryability, and any recovery context such as intent id, prepared-action id, or txid.

Valid transitions are explicit and unit-tested. A user rejection returns to a wallet-ready/idle state without representing the payment as failed. Once a txid exists, the UI must never tell the user to send again unless the backend proves the transaction was rejected or invalid.

### Route-local checkout core

The `/buy` route owns:

- the checkout reducer and transition helpers;
- the orchestration hook that creates an intent, prepares an action, asks the selected adapter to execute it, submits the txid, and starts tracking;
- normalized checkout errors;
- minimal recovery storage;
- Xverse and TronLink adapters;
- mapping from backend prepared-action DTOs to adapter inputs.

The existing page controller remains responsible for market/order presentation and composing the checkout view model. It does not contain chain-specific transaction branches.

### Wallet adapter contract

Adapters expose a small contract:

- `isAvailable()`
- `connect()`
- `getStatus()`
- `switchNetwork()` only when the provider supports it
- `sendPreparedAction(action)`
- `disconnect()` when supported

Adapters cannot calculate amounts, choose treasury addresses, change token contracts, or construct alternative transactions.

### Xverse adapter

- Use Sats Connect and explicitly select Xverse.
- Request account access only after a user gesture.
- Require Bitcoin mainnet.
- Use the payment address returned by the wallet for display and intent attribution, but do not treat it as cryptographic login.
- Execute backend-prepared `{ recipientAddress, amountSats, network }` through `sendTransfer`.
- Accept only a successful response containing a valid 64-character BTC txid.
- Let Xverse own input selection, miner fee selection, signing, and broadcast.

### TronLink adapter

- Prefer `window.tron`; do not build new behavior around the legacy `window.tronLink` alias.
- Authorize the site through the recommended account-request API.
- Require Tron mainnet chain id `0x2b6653dc`.
- Do not request a separate login-message signature during payment checkout.
- Execute only the backend-prepared official USDT contract `transfer(recipient, amountBaseUnits)` request.
- Require a valid 64-character Tron txid from the wallet result.

### Persistence and recovery

- Before backend acknowledgement, store a minimal pending-submission record in `sessionStorage`: intent id, checkout capability, prepared-action id, chain, and txid.
- Remove the capability and pending-submission record immediately after idempotent txid submission succeeds.
- Persist only a non-secret tracking reference after submission: intent id, chain, asset, and txid.
- On reload, retry an unacknowledged txid submission before presenting any option to start a new payment.
- Do not persist entire mutable intent/payment DTOs as the source of truth.

## Backend Architecture

### Capabilities endpoint

Add a public read endpoint that reports enabled wallet-checkout methods without exposing secrets or treasury addresses. The frontend must not hard-code BTC as enabled while `BTC_PAYMENTS_ENABLED` can disable it on the backend.

Each capability includes chain, asset, network, wallet provider, enabled state, and asset decimals. BTC reports Xverse/mainnet. Tron reports TronLink/mainnet and USDT-TRC20.

### Checkout capability

BTC checkout must not depend on Bitcoin message-signature authentication. Tron payment checkout will also use the payment capability instead of a separate login-signature step.

When an intent is created:

- generate 32 random bytes;
- store only a SHA-256 hash on the intent;
- return the raw capability once with the create-intent response;
- require it on prepare-action and submit-txid requests;
- compare hashes in constant time;
- reject preparation after the payment window;
- keep txid submission authorized through the late-submission grace period so a transaction broadcast near expiry can still be recorded and reconciled.

This capability proves continuity of the checkout session. It does not prove wallet ownership; on-chain reconciliation proves payment.

### Prepared wallet actions

Add:

- `PaymentWalletActionKind.BITCOIN_TRANSFER`
- `PaymentWalletTxIdKind.BTC_TX_HASH`
- a unique BTC txid index on `payment_wallet_actions`
- a Bitcoin wallet-action executor in the registry

Prepared BTC action:

```ts
{
  kind: 'bitcoin_transfer';
  network: 'mainnet';
  recipientAddress: string;
  amountSats: string;
}
```

Prepared Tron action:

```ts
{
  kind: 'tron_transaction';
  network: 'mainnet';
  chainId: '0x2b6653dc';
  contractAddress: string;
  functionSelector: 'transfer(address,uint256)';
  recipientAddress: string;
  amountBaseUnits: string;
  feeLimitSun: string;
}
```

Prepared actions are immutable, short-lived, single-intent records. Preparing a replacement action cancels or expires older unused actions for the same intent.

### Txid submission

Submission validates:

- checkout capability;
- intent/action relationship;
- chain and action kind;
- txid format;
- duplicate txid ownership.

It then records the txid and marks the action `SUBMITTED` in one transaction. Repeated submission of the same action and txid returns the existing tracking result. The endpoint does not require the provider to return transaction data immediately.

Action expiry prevents a new wallet execution. It does not discard a txid already returned by the wallet: the same prepared action may submit that txid during the late-submission grace period, and reconciliation determines whether the on-chain payment was on time or late.

`USED` means reconciliation proved the transaction matches. It must not be set merely because the browser supplied a txid.

### Reconciliation

The background reconciler is the only normal owner of chain-provider reads. The public status endpoint reads persisted state.

For Bitcoin:

- fetch the submitted txid when available;
- require a successful Bitcoin transaction containing an output to the intent's unique derived address;
- require the exact satoshi amount for automatic confirmation;
- record output index and enforce `(chain, txid, outputIndex)` uniqueness;
- count confirmations using backend data;
- use bounded receive-address scanning only to recover a replaced/RBF txid or an interrupted submit call;
- never require Bitcoin inputs to map to one sender address.

For Tron USDT:

- fetch the submitted txid;
- require a successful receipt;
- match the official mainnet USDT contract;
- match `Transfer` topic, sender, treasury receiver, and exact base-unit amount;
- count solid-block confirmations;
- use bounded block scanning only as recovery for an interrupted submit call.

Every reconciliation write is transactional and idempotent. One intent's provider failure does not abort the rest of the batch. Retryable provider failures update check metadata and use bounded backoff without changing the payment to `FAILED`.

### Expiry and late payments

- An intent with no submitted or detected transaction may become `EXPIRED` after its payment lifetime.
- A submitted transaction is checked before expiry logic.
- Broadcast transactions remain trackable through a configurable grace period.
- A matching transaction first observed after the valid payment window becomes `LATE_PAID` and is visible for admin review.
- Underpayment and overpayment remain explicit review states; the wallet path should normally avoid them by sending an exact backend-provided amount.

## Error Handling

- Missing Xverse or TronLink: show the supported-wallet requirement and installation guidance. Do not offer direct send.
- Wrong network: request a supported network switch when possible; otherwise tell the user to switch inside the wallet.
- User rejects connect or transaction: return to a safe retryable state without creating a false failure record.
- Insufficient balance or fee resources: keep the intent/action available for a retry while valid.
- Prepared action expired before approval: create one replacement action for the same intent and retry only after an explicit user action.
- Broadcast succeeded but txid submission failed: preserve the txid and retry submission; never prompt for a second payment.
- Provider has not indexed the txid: stay in `tracking` and retry asynchronously.
- Provider outage/rate limit: apply backoff and keep persisted state unchanged.
- Transaction mismatch, failed receipt, duplicate txid, or wrong contract/recipient: reject or invalidate that action with an admin-visible reason, but keep an otherwise-valid intent retryable while its payment window remains open.
- A transaction that reaches the correct receiver with the wrong amount becomes underpaid or overpaid review state rather than a generic failure.

## UI Behavior

- Asset selection shows only backend-enabled wallet checkout capabilities.
- Selecting BTC presents Xverse only.
- Selecting USDT-TRC20 presents TronLink only.
- The wallet confirmation screen is the only place a recipient and amount are approved.
- After broadcast, show the txid and a persistent tracking state.
- Distinguish `submitted`, `confirming`, and `confirmed` in user copy.
- Closing the dialog after broadcast must not lose tracking.
- Unsupported or unavailable wallets disable checkout with a visible reason; they do not expose a fallback path.

## Removal Scope

Remove from `/buy`:

- direct checkout mode selection;
- manual payment-wallet address input;
- QR/payment URI rendering used for direct payment;
- backend payment-URI DTO fields/builders if the consumer audit confirms they are unused;
- `direct_address` and `direct_instructions` stages;
- direct-send actions and callbacks;
- manual-checkout feature flags and copy;
- direct-send persistence fields;
- fallback branches that silently route unsupported wallets to manual payment.

ETH and SOL remain available only through their supported wallet execution paths. If their providers are unavailable, those assets are disabled with a reason.

## Testing Strategy

### Baseline gate

Before feature validation:

- finish recording the already-resolved conflict files in Git through the user's normal staging workflow;
- run a clean frontend dependency installation;
- repair cleanup regressions until frontend type-check and targeted lint pass;
- establish backend build/test status before attributing failures to wallet-checkout work.

### Frontend unit tests

- every valid and invalid state-machine transition;
- user rejection returns to a retryable state;
- txid-present failures never allow a second payment prompt;
- pending submission recovery after reload;
- Xverse mapping preserves exact satoshis and recipient;
- TronLink mapping preserves contract, recipient, and base-unit amount;
- wrong network, missing provider, malformed response, and duplicate click behavior;
- absence of direct-send stages/actions in the public view model.

### Backend unit tests

- capability generation, hashing, constant-time validation, expiry, and wrong-intent rejection;
- BTC and Tron prepared-action construction;
- BTC/Tron txid format validation and unique ownership;
- idempotent repeated submission;
- provider-indexing delay after submission;
- exact receiver/contract/amount matching;
- confirmation thresholds;
- RBF/replacement recovery for BTC;
- failed Tron receipt;
- underpaid, overpaid, expired, and late-paid classification;
- one reconciliation failure does not abort the batch.

### Integration tests

- concurrent BTC intent creation produces unique derivation indexes and addresses;
- submitted action and payment writes remain consistent under retry/concurrency;
- duplicate txids cannot attach to different intents;
- status endpoint performs no chain-provider call;
- confirmed payments appear through existing portfolio/admin queries.

### Manual verification

- Xverse mainnet connection and mocked/controlled transfer approval flow;
- TronLink mainnet authorization, network enforcement, USDT approval, and txid tracking;
- close/reopen/reload after broadcast;
- provider indexing delay and outage recovery;
- no manual address, QR, payment URI, or direct-send route remains reachable.

## Rollout

1. Restore a green post-cleanup baseline.
2. Add backend capability-token and wallet-action schema changes.
3. Add BTC action executor and correct asynchronous reconciliation.
4. Add the frontend checkout core and adapters.
5. Move Tron onto the new core and capability flow.
6. Remove direct-send code and flags.
7. Run unit, integration, build, lint, type, and manual wallet verification.
8. Enable BTC only when the backend xpub validates and the capabilities endpoint reports it enabled.

## Success Criteria

- BTC can be purchased only through Xverse wallet approval.
- USDT-TRC20 can be purchased only through TronLink wallet approval.
- No direct-send or copy/paste payment path remains.
- Backend-prepared recipient and amount are the values shown to the wallet.
- A broadcast transaction never fails merely because provider indexing is delayed.
- Reload after broadcast resumes submission or tracking without asking for another payment.
- Payment confirmation requires exact on-chain verification and configured confirmations.
- Confirmed BTC and Tron payments appear in existing portfolio/admin reporting.
- Frontend and backend scoped validation are green, with any unrelated baseline blockers documented separately.
