# Bitcoin and Tron Wallet Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox ('- [ ]') syntax for tracking.

**Goal:** Replace /buy direct-send checkout with confirmation-gated wallet checkout, adding Xverse BTC and hardening TronLink USDT-TRC20 execution.

**Architecture:** The backend creates a quoted intent plus an opaque checkout capability, prepares immutable chain-specific actions, records wallet-returned txids idempotently, and reconciles them asynchronously. The frontend has one route-local reducer-driven lifecycle; Xverse and TronLink adapters only connect, enforce network, and send backend-prepared actions.

**Tech Stack:** Next.js App Router, React, TypeScript, TanStack Query, Sats Connect, TronLink/TronWeb, NestJS, TypeORM/PostgreSQL, Alchemy, Jest.

---

## Working-tree rules

- The existing cleanup, package changes, and conflict resolutions are user-owned. Do not revert, stage, or commit any file automatically.
- Record current frontend type/lint failures before work. Only attribute later failures to checkout when a touched file is named in output.
- Do not restore frontend test tooling removed by cleanup. Add backend Jest coverage for lifecycle logic and use targeted frontend ESLint plus TypeScript validation.

## File map

### Backend

- Create: be/src/infrastructure/database/migrations/1783900800000-WalletCheckoutCapabilityAndBitcoinActions.ts
- Create: be/src/modules/payments/services/payment-checkout-capability.service.ts
- Create: be/src/modules/payments/services/payment-checkout-capability.service.spec.ts
- Create: be/src/modules/payments/wallet-action-executors/bitcoin-wallet-action.executor.ts
- Create: be/src/modules/payments/wallet-action-executors/bitcoin-wallet-action.executor.spec.ts
- Modify: be/src/infrastructure/config/env.ts
- Modify: be/src/modules/payments/entities/payment-intent.entity.ts
- Modify: be/src/modules/payments/entities/payment-wallet-action.entity.ts
- Modify: be/src/modules/payments/payments.types.ts
- Modify: be/src/modules/payments/dto/payments.dto.ts
- Modify: be/src/modules/payments/payments.module.ts
- Modify: be/src/modules/payments/payments.controller.ts
- Modify: be/src/modules/payments/payments.service.ts
- Modify: be/src/modules/payments/payments.service.spec.ts
- Modify: be/src/modules/payments/services/payment-state.service.ts
- Modify: be/src/modules/payments/services/tron-payment-execution.service.ts
- Modify: be/src/modules/payments/wallet-action-executors/wallet-action-executor.types.ts
- Modify: be/src/modules/payments/wallet-action-executors/wallet-checkout.guards.ts
- Modify: be/src/modules/payments/wallet-action-executors/wallet-action-executor.registry.ts
- Modify: be/src/modules/payments/wallet-action-executors/ethereum-wallet-action.executor.ts
- Modify: be/src/modules/payments/wallet-action-executors/solana-wallet-action.executor.ts
- Modify: be/src/modules/payments/wallet-action-executors/tron-wallet-action.executor.ts

### Frontend

- Modify: fe/package.json and fe/package-lock.json
- Modify: fe/src/api-routes.ts
- Modify: fe/src/app/api/public/[...path]/route.ts
- Modify: fe/src/libs/Env.ts
- Modify: fe/src/dal/app/payments/payments.types.ts
- Modify: fe/src/dal/app/payments/payments.services.ts
- Create: fe/src/app/(marketing)/buy/types/wallet-checkout.types.ts
- Create: fe/src/app/(marketing)/buy/utils/wallet-checkout-machine.ts
- Create: fe/src/app/(marketing)/buy/utils/wallet-checkout-storage.ts
- Create: fe/src/app/(marketing)/buy/hooks/use-wallet-checkout.ts
- Create: fe/src/app/(marketing)/buy/wallet-adapters/xverse-checkout-wallet-adapter.ts
- Modify: fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts
- Modify: fe/src/app/(marketing)/buy/_components/payment-dialogs.tsx
- Modify: fe/src/app/(marketing)/buy/_components/payment-card.tsx
- Modify: fe/src/app/(marketing)/buy/types/buy-view-model.ts
- Modify: fe/src/app/(marketing)/buy/types/checkout-wallet.types.ts
- Modify: fe/src/app/(marketing)/buy/utils/supported-asset-options.ts
- Modify: fe/src/app/(marketing)/buy/utils/get-checkout-error-message.ts
- Modify: fe/src/app/(marketing)/buy/wallet-adapters/checkout-wallet-adapter.ts
- Modify: fe/src/app/(marketing)/buy/wallet-adapters/tronlink-checkout-wallet-adapter.ts
- Modify: fe/src/app/(marketing)/buy/wallet-adapters/solana-metamask-checkout-wallet-adapter.ts
- Delete after import search is clean: fe/src/app/(marketing)/buy/utils/buy-checkout-flow.ts
- Delete after import search is clean: fe/src/app/(marketing)/buy/utils/buy-payment-storage.ts

## Task 1: Record baseline and direct-send removal surface

**Files:**
- Inspect: fe/src/app/(marketing)/buy/**, fe/src/dal/app/payments/**, be/src/modules/payments/**
- No production code change.

- [ ] **Step 1: Record conflict and diff baseline**

Run:

~~~bash
git status --short
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' fe/src be/src || true
~~~

Expected: no working-file conflict markers. Do not stage user files.

- [ ] **Step 2: Record validation baseline**

Run:

~~~bash
cd fe && npm run check:types
cd fe && npx eslint 'src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts'
cd be && npm test -- payments.service.spec.ts --runInBand
~~~

Expected: preserve existing frontend failures as baseline evidence.

- [ ] **Step 3: Locate direct-send references**

Run:

~~~bash
rg -n 'direct_address|direct_instructions|useDirectSend|createDirectPayment|paymentWalletAddress|NEXT_PUBLIC_USDT_MANUAL_CHECKOUT_ENABLED' 'fe/src/app/(marketing)/buy' fe/src/libs/Env.ts
~~~

Expected: all matches are in the route-local checkout path or client environment schema.

## Task 2: Persist checkout capability and Bitcoin transaction identifiers

**Files:**
- Create: be/src/infrastructure/database/migrations/1783900800000-WalletCheckoutCapabilityAndBitcoinActions.ts
- Modify: be/src/infrastructure/config/env.ts
- Modify: be/src/modules/payments/entities/payment-intent.entity.ts
- Modify: be/src/modules/payments/entities/payment-wallet-action.entity.ts
- Modify: be/src/modules/payments/payments.types.ts
- Test: be/src/modules/payments/payments.service.spec.ts

- [ ] **Step 1: Write failing fixture assertions**

~~~ts
const intent = buildBitcoinIntent({
  checkoutTokenHash: 'a'.repeat(64),
});

expect(PaymentWalletTxIdKind.BTC_TX_HASH).toBe('btc_tx_hash');
expect(intent.checkoutTokenHash).toHaveLength(64);
~~~

- [ ] **Step 2: Run the focused test**

Run:

~~~bash
cd be && npm test -- payments.service.spec.ts --runInBand
~~~

Expected: FAIL because the new field and enum value do not exist.

- [ ] **Step 3: Add migration, entity fields, and configuration**

Migration operations:

~~~ts
await queryRunner.query('ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS checkout_token_hash varchar(64)');

await queryRunner.query(
  "CREATE UNIQUE INDEX IF NOT EXISTS \"IDX_payment_wallet_actions_btc_tx_unique\" ON payment_wallet_actions (tx_id_kind, tx_id) WHERE tx_id_kind = 'btc_tx_hash' AND tx_id IS NOT NULL",
);
~~~

Entity and enum additions:

~~~ts
@Column({ name: 'checkout_token_hash', type: 'varchar', length: 64, nullable: true })
checkoutTokenHash!: string | null;

BITCOIN_TRANSFER = 'bitcoin_transfer'
BTC_TX_HASH = 'btc_tx_hash'
~~~

Add paymentLateSubmissionGraceMinutes from PAYMENT_LATE_SUBMISSION_GRACE_MINUTES with default 30.

- [ ] **Step 4: Run migration and test**

Run:

~~~bash
cd be && npm run migration:run:dev
cd be && npm test -- payments.service.spec.ts --runInBand
~~~

Expected: migration applies once and fixture contract passes.

## Task 3: Implement opaque checkout-capability service

**Files:**
- Create: be/src/modules/payments/services/payment-checkout-capability.service.ts
- Create: be/src/modules/payments/services/payment-checkout-capability.service.spec.ts
- Modify: be/src/modules/payments/payments.module.ts
- Modify: be/src/modules/payments/payments.service.ts

- [ ] **Step 1: Write failing lifecycle tests**

~~~ts
it('allows txid submission through grace but blocks preparation after intent expiry', () => {
  const issued = service.issue();
  const intent = buildIntent({
    checkoutTokenHash: issued.tokenHash,
    expiresAt: new Date('2026-07-13T10:00:00.000Z'),
  });

  expect(() => service.assertCanSubmit(intent, issued.rawToken, new Date('2026-07-13T10:15:00.000Z'))).not.toThrow();
  expect(() => service.assertCanPrepare(intent, issued.rawToken, new Date('2026-07-13T10:15:00.000Z'))).toThrow('Payment intent expired');
});
~~~

Also cover missing, malformed, wrong, terminal, and grace-window tokens.

- [ ] **Step 2: Run new tests**

Run:

~~~bash
cd be && npm test -- payment-checkout-capability.service.spec.ts --runInBand
~~~

Expected: FAIL because service is absent.

- [ ] **Step 3: Implement issue, hash, and constant-time validation**

~~~ts
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

issue() {
  const rawToken = randomBytes(32).toString('base64url');
  return { rawToken, tokenHash: this.hash(rawToken) };
}

private hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

private matches(expected: string, supplied: string) {
  const left = Buffer.from(expected, 'hex');
  const right = Buffer.from(this.hash(supplied), 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
~~~

Expose assertCanPrepare and assertCanSubmit. Preparation stops at intent expiry. Submission permits non-terminal intent expiry plus paymentLateSubmissionGraceMinutes.

- [ ] **Step 4: Issue token atomically with payment intent**

In PaymentsService.createIntent, issue inside the existing transaction, persist checkoutTokenHash only, and return:

~~~ts
{
  intent: this.toPublicIntent(savedIntent),
  checkoutToken: issued.rawToken,
}
~~~

- [ ] **Step 5: Run capability tests**

Run:

~~~bash
cd be && npm test -- payment-checkout-capability.service.spec.ts --runInBand
~~~

Expected: PASS.

## Task 4: Refactor action executors and add Bitcoin

**Files:**
- Create: be/src/modules/payments/wallet-action-executors/bitcoin-wallet-action.executor.ts
- Create: be/src/modules/payments/wallet-action-executors/bitcoin-wallet-action.executor.spec.ts
- Modify: be/src/modules/payments/wallet-action-executors/wallet-action-executor.types.ts
- Modify: be/src/modules/payments/wallet-action-executors/wallet-checkout.guards.ts
- Modify: be/src/modules/payments/wallet-action-executors/wallet-action-executor.registry.ts
- Modify: be/src/modules/payments/wallet-action-executors/ethereum-wallet-action.executor.ts
- Modify: be/src/modules/payments/wallet-action-executors/solana-wallet-action.executor.ts
- Modify: be/src/modules/payments/wallet-action-executors/tron-wallet-action.executor.ts
- Modify: be/src/modules/payments/{payments.module.ts,payments.types.ts,dto/payments.dto.ts}

- [ ] **Step 1: Write failing Bitcoin executor tests**

~~~ts
it('prepares an immutable Xverse mainnet transfer', async () => {
  const action = await executor.prepare({
    intent: buildBitcoinIntent({
      receiverAddress: 'bc1qexample',
      expectedAmountBaseUnits: '125000',
    }),
    senderAddress: 'bc1qsender',
    dto: { chain: PaymentChain.BITCOIN, senderAddress: 'bc1qsender' },
  });

  expect(action).toMatchObject({
    kind: PaymentWalletActionKind.BITCOIN_TRANSFER,
    chain: PaymentChain.BITCOIN,
    bitcoin: { network: 'mainnet', recipientAddress: 'bc1qexample', amountSats: '125000' },
  });
});

it.each(['a'.repeat(63), 'g'.repeat(64)])('rejects invalid txid %s', txId => {
  expect(() => executor.assertTxId(PaymentWalletTxIdKind.BTC_TX_HASH, txId)).toThrow();
});
~~~

- [ ] **Step 2: Run Bitcoin tests**

Run:

~~~bash
cd be && npm test -- bitcoin-wallet-action.executor.spec.ts --runInBand
~~~

Expected: FAIL because executor and DTO are absent.

- [ ] **Step 3: Narrow executor contract**

~~~ts
export type WalletActionPrepareInput = {
  intent: PaymentIntentEntity;
  senderAddress: string;
  dto: PreparePaymentWalletActionDto;
};

export interface WalletActionExecutor {
  readonly chain: PaymentChain;
  prepare(input: WalletActionPrepareInput): Promise<PreparedWalletActionDto>;
  assertTxId(kind: PaymentWalletTxIdKind, txId: string): void;
}
~~~

Delete executor submit/reconcile behavior. Existing chain verifiers stay available to the scanner.

- [ ] **Step 4: Implement and register Bitcoin executor**

Persist BITCOIN_TRANSFER with a five-minute expiry and return:

~~~ts
{
  kind: PaymentWalletActionKind.BITCOIN_TRANSFER,
  paymentIntentId: input.intent.id,
  preparedActionId: action.id,
  chain: PaymentChain.BITCOIN,
  bitcoin: {
    network: 'mainnet',
    recipientAddress: input.intent.receiverAddress,
    amountSats: input.intent.expectedAmountBaseUnits,
  },
  expiresAt: action.expiresAt,
}
~~~

Use /^[a-fA-F0-9]{64}$/ for BTC txid validation. Register in PaymentsModule and WalletActionExecutorRegistry.

- [ ] **Step 5: Run executor tests**

Run:

~~~bash
cd be && npm test -- bitcoin-wallet-action.executor.spec.ts payments.service.spec.ts --runInBand
~~~

Expected: PASS.

## Task 5: Record txids first and reconcile asynchronously

**Files:**
- Modify: be/src/modules/payments/payments.service.ts
- Modify: be/src/modules/payments/payments.scanner.ts
- Modify: be/src/modules/payments/services/payment-state.service.ts
- Modify: be/src/modules/payments/services/tron-payment-execution.service.ts
- Modify: be/src/modules/payments/payments.service.spec.ts

- [ ] **Step 1: Write failing lifecycle tests**

~~~ts
it('records a Tron txid without waiting for provider indexing', async () => {
  const result = await service.submitWalletTxResult(intent.id, checkoutToken, {
    chain: PaymentChain.TRON,
    preparedActionId: action.id,
    txIdKind: PaymentWalletTxIdKind.TRON_TX_HASH,
    txId: 'a'.repeat(64),
  });

  expect(alchemyService.getTronTransactionInfoById).not.toHaveBeenCalled();
  expect(result.intent.status).toBe(PaymentIntentStatus.CONFIRMING);
  expect(result.payment?.status).toBe(PaymentStatus.CONFIRMING);
});

it('reads status from persisted data without scanning', async () => {
  await service.getIntentStatus(intent.id);
  expect(alchemyService.getBitcoinAddressTransactions).not.toHaveBeenCalled();
});
~~~

Also cover repeat submit, late payment, post-expiry submission grace, and scanner isolation after provider failure.

- [ ] **Step 2: Run lifecycle tests**

Run:

~~~bash
cd be && npm test -- payments.service.spec.ts --runInBand
~~~

Expected: FAIL because current Tron submit fetches immediately and status scans.

- [ ] **Step 3: Implement generic idempotent submission**

Use this method signature:

~~~ts
submitWalletTxResult(
  intentId: string,
  checkoutToken: string,
  input: SubmitPaymentTxResultDto,
): Promise<PaymentIntentStatusDto>
~~~

Within one transaction: validate token/action/chain/txid, return prior result for same action plus txid, reject cross-intent duplicate, write action SUBMITTED with usedAt null, upsert PaymentEntity CONFIRMING with zero confirmations, and transition intent to CONFIRMING. Do not call Alchemy. Mark action USED only after successful reconciliation.

- [ ] **Step 4: Make status database-only and fix expiry order**

~~~ts
const submittedAction = await this.findSubmittedAction(intent.id);
const match = await this.findMatch(intent, submittedAction);

if (match) return this.persistMatch(intent, match);
if (!submittedAction && now > intent.expiresAt) return this.expireIntent(intent);
if (submittedAction && now > this.getSubmissionDeadline(intent)) return this.expireIntent(intent);
~~~

getIntentStatus loads persisted intent/payment only. Scanner wraps each intent in try/catch, records a redacted retryable provider error in lastCheckResult, and continues batch processing.

- [ ] **Step 5: Reconcile from scanner only**

- BTC: query unique receiver address; prefer exact submitted txid, otherwise bounded recovery for missing submission or RBF. Require exact output address and sats.
- Tron: query submitted txid; missing provider record remains confirming. Require successful receipt, USDT contract, Transfer topic, sender, receiver, and amount.
- SOL: run submitted-signature verification in scanner, not browser submission.
- ETH: retain transfer scan from intent creation block in scanner only.

- [ ] **Step 6: Run tests and build**

Run:

~~~bash
cd be && npm test -- payments.service.spec.ts bitcoin-wallet-action.executor.spec.ts payment-checkout-capability.service.spec.ts --runInBand
cd be && npm run build
~~~

Expected: PASS and Nest compiles.

## Task 6: Expose public capability-protected payment APIs

**Files:**
- Modify: be/src/modules/payments/{payments.controller.ts,payments.service.ts,dto/payments.dto.ts,payments.service.spec.ts}
- Modify: fe/src/{api-routes.ts,app/api/public/[...path]/route.ts,dal/app/payments/payments.types.ts,dal/app/payments/payments.services.ts}

- [ ] **Step 1: Add failing controller and capability tests**

Cover missing token, wrong token, valid token, disabled BTC, enabled BTC, and Tron with valid backend prerequisites.

- [ ] **Step 2: Replace payment JWT guards with checkout-token header**

~~~ts
@Post('intents/:intentId/wallet-action')
prepareWalletAction(
  @Param('intentId') intentId: string,
  @Headers('x-payment-checkout-token') checkoutToken: string | undefined,
  @Body() body: PreparePaymentWalletActionDto,
) {
  return this.paymentsService.prepareWalletAction(intentId, checkoutToken ?? '', body);
}
~~~

Apply same header to tx-result. Remove CurrentAuth and InternalJwtGuard only from payment action endpoints.

- [ ] **Step 3: Add GET /payments/capabilities**

Return ETH, SOL, BTC, and USDT_TRC20 records with chain, asset, walletProvider, network, decimals, and enabled. BTC uses btcPaymentsEnabled and xverse/mainnet/8. Tron uses tronlink/mainnet/6 and requires Alchemy plus valid treasury configuration.

- [ ] **Step 4: Forward checkout header via public proxy**

~~~ts
headers: {
  'Content-Type': request.headers.get('content-type') ?? 'application/json',
  ...(request.headers.has('x-payment-checkout-token')
    ? { 'x-payment-checkout-token': request.headers.get('x-payment-checkout-token')! }
    : {}),
},
~~~

- [ ] **Step 5: Replace BFF payment DAL with public proxy contract**

~~~ts
export type IPaymentCheckoutSession = {
  intent: IPaymentIntentPublic;
  checkoutToken: string;
};

export type IPaymentCheckoutCapability = {
  chain: PaymentChain;
  asset: PaymentAsset;
  walletProvider: 'metamask' | 'metamask_solana' | 'xverse' | 'tronlink';
  network: 'mainnet' | 'mainnet-beta';
  decimals: number;
  enabled: boolean;
};
~~~

Use public proxy routes and x-payment-checkout-token. Remove payment action useAxiosAuth and nonexistent BFF payment URLs. Add usePaymentCheckoutCapabilities.

- [ ] **Step 6: Validate contract**

Run:

~~~bash
cd be && npm test -- payments.service.spec.ts --runInBand
cd fe && npx eslint src/api-routes.ts 'src/app/api/public/[...path]/route.ts' src/dal/app/payments/payments.services.ts src/dal/app/payments/payments.types.ts
~~~

Expected: DAL has no BFF payment target.

## Task 7: Build route-local reducer and recovery storage

**Files:**
- Create: fe/src/app/(marketing)/buy/types/wallet-checkout.types.ts
- Create: fe/src/app/(marketing)/buy/utils/wallet-checkout-machine.ts
- Create: fe/src/app/(marketing)/buy/utils/wallet-checkout-storage.ts
- Modify: fe/src/app/(marketing)/buy/types/buy-view-model.ts

- [ ] **Step 1: Define state union**

~~~ts
export type WalletCheckoutState =
  | { status: 'idle' }
  | { status: 'connecting_wallet' }
  | { status: 'creating_intent' }
  | { status: 'preparing_action'; session: IPaymentCheckoutSession }
  | { status: 'awaiting_wallet_approval'; session: IPaymentCheckoutSession; action: PreparedWalletAction }
  | { status: 'submitting_txid'; pending: PendingWalletSubmission }
  | { status: 'tracking'; reference: WalletTrackingReference }
  | { status: 'confirmed'; reference: WalletTrackingReference }
  | { status: 'failed'; error: WalletCheckoutError; recovery?: PendingWalletSubmission | WalletTrackingReference };
~~~

- [ ] **Step 2: Implement exhaustive reducer**

~~~ts
export function reduceWalletCheckout(state: WalletCheckoutState, event: WalletCheckoutEvent): WalletCheckoutState {
  switch (event.type) {
    case 'wallet_connected': return { status: 'creating_intent' };
    case 'intent_created': return { status: 'preparing_action', session: event.session };
    case 'action_prepared': return { status: 'awaiting_wallet_approval', session: event.session, action: event.action };
    case 'txid_received': return { status: 'submitting_txid', pending: event.pending };
    case 'txid_recorded': return { status: 'tracking', reference: event.reference };
    case 'payment_confirmed': return { status: 'confirmed', reference: event.reference };
    case 'failed': return { status: 'failed', error: event.error, recovery: event.recovery };
  }
}
~~~

Throw for impossible transitions in development.

- [ ] **Step 3: Add storage boundary**

~~~ts
export type PendingWalletSubmission = {
  intentId: string;
  checkoutToken: string;
  preparedActionId: string;
  chain: PaymentChain;
  txIdKind: PaymentTransactionIdKind;
  txId: string;
};

export type WalletTrackingReference = {
  intentId: string;
  chain: PaymentChain;
  asset: PaymentAsset;
  txIdKind: PaymentTransactionIdKind;
  txId: string;
};
~~~

Use sessionStorage for pending secret data; persist only non-secret tracking after acknowledged submission.

- [ ] **Step 4: Remove manual view-model fields**

Remove direct_address/direct_instructions, paymentWalletAddress, direct-send actions, and payment URI instructions after consumers move.

- [ ] **Step 5: Validate local modules**

Run:

~~~bash
cd fe && npx eslint 'src/app/(marketing)/buy/types/wallet-checkout.types.ts' 'src/app/(marketing)/buy/utils/wallet-checkout-machine.ts' 'src/app/(marketing)/buy/utils/wallet-checkout-storage.ts' 'src/app/(marketing)/buy/types/buy-view-model.ts'
~~~

Expected: PASS.

## Task 8: Implement Xverse and transaction-only TronLink adapters

**Files:**
- Modify: fe/package.json and fe/package-lock.json
- Create: fe/src/app/(marketing)/buy/wallet-adapters/xverse-checkout-wallet-adapter.ts
- Modify: fe/src/app/(marketing)/buy/wallet-adapters/{checkout-wallet-adapter.ts,tronlink-checkout-wallet-adapter.ts}
- Modify: fe/src/app/(marketing)/buy/types/checkout-wallet.types.ts
- Modify: fe/src/app/(marketing)/buy/constants/tronlink.ts

- [ ] **Step 1: Add Sats Connect**

Run:

~~~bash
cd fe && npm install sats-connect
~~~

Expected: only required dependency graph changes.

- [ ] **Step 2: Implement Xverse adapter**

~~~ts
const response = await Wallet.request('sendTransfer', {
  recipients: [{
    address: action.bitcoin.recipientAddress,
    amount: Number(action.bitcoin.amountSats),
  }],
  network: { type: 'Mainnet' },
  providerId: 'xverse',
});

if (response.status !== 'success' || !/^[a-f0-9]{64}$/iu.test(response.result.txid)) {
  throw normalizeXverseError(response);
}
~~~

Connect only after a user click. Reject amountSats above Number.MAX_SAFE_INTEGER before conversion. Return BITCOIN and btc_tx_hash only.

- [ ] **Step 3: Remove TronLink checkout login signature**

Connect using window.tron account authorization and require chain 0x2b6653dc. Remove checkout calls to createChallenge, signMessageV2, and walletAuthService.verify. Execute only prepared USDT transfer:

~~~ts
const txId = await tronWeb.contract().at(action.tron.contractAddress)
  .transfer(action.tron.recipientAddress, action.tron.amountBaseUnits)
  .send({ feeLimit: Number(action.tron.feeLimitSun) });
~~~

Reject action kind, contract, or chain mismatch and malformed returned txid.

- [ ] **Step 4: Update adapter unions**

Add BITCOIN status, BitcoinPreparedWalletAction, and BitcoinWalletTxResult. Give every wallet status one common optional networkId field so the orchestration hook never reads chain-specific chainId or walletChainId properties. Remove checkout adapter verify method and all manual/direct send methods.

- [ ] **Step 5: Validate adapters**

Run:

~~~bash
cd fe && npx eslint 'src/app/(marketing)/buy/wallet-adapters/xverse-checkout-wallet-adapter.ts' 'src/app/(marketing)/buy/wallet-adapters/tronlink-checkout-wallet-adapter.ts' 'src/app/(marketing)/buy/wallet-adapters/checkout-wallet-adapter.ts' 'src/app/(marketing)/buy/types/checkout-wallet.types.ts'
~~~

Expected: PASS.

## Task 9: Orchestrate a single wallet checkout sequence

**Files:**
- Create: fe/src/app/(marketing)/buy/hooks/use-wallet-checkout.ts
- Modify: fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts
- Modify: fe/src/app/(marketing)/buy/utils/get-checkout-error-message.ts
- Modify: fe/src/dal/app/payments/payments.services.ts

- [ ] **Step 1: Implement sole execution path**

~~~ts
await adapter.connect();
const wallet = adapter.getStatus();
if (!wallet) throw new Error('Wallet did not return a connected account.');
const session = await paymentsService.createPaymentIntent({
  chain: capability.chain,
  asset: capability.asset,
  tokenAmount,
  senderAddress: wallet.address,
});
const action = await paymentsService.prepareWalletAction(
  session.intent.id,
  session.checkoutToken,
  { chain: capability.chain, senderAddress: wallet.address, walletChainId: wallet.networkId },
);
const result = await adapter.sendPreparedAction(action);
writePendingWalletSubmission({ ...result, checkoutToken: session.checkoutToken });
await paymentsService.submitPaymentIntentTxResult(session.intent.id, session.checkoutToken, result);
clearPendingWalletSubmission();
~~~

Dispatch reducer events around every await. Persist txid before submit network call. Treat user cancellation as retryable wallet_approval error.

- [ ] **Step 2: Implement reload recovery**

Retry stored pending submission before allowing fresh payment. After acknowledgement, write non-secret tracking reference and poll database status only.

- [ ] **Step 3: Reduce page controller to composition**

Delete submitSolanaWalletPayment, submitTronWalletPayment, manual address state, direct-send functions, and duplicated EVM branch. Keep market display, selection, capability query, selected adapter, and view-model composition.

- [ ] **Step 4: Add exact user-safe errors**

~~~ts
missing_xverse_provider: 'Install or unlock Xverse to pay with Bitcoin.'
missing_tronlink_provider: 'Install or unlock TronLink to pay with USDT TRC20.'
wallet_rejected: 'You cancelled the wallet request. No payment was sent.'
txid_submission_pending: 'Your wallet broadcast the transaction. We are recording it now—do not send again.'
tracking: 'Transaction submitted. Waiting for blockchain confirmation.'
~~~

- [ ] **Step 5: Validate controller**

Run:

~~~bash
cd fe && npx eslint 'src/app/(marketing)/buy/hooks/use-wallet-checkout.ts' 'src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts' 'src/app/(marketing)/buy/utils/get-checkout-error-message.ts'
~~~

Expected: one execution path, no direct fallback.

## Task 10: Render wallet-only UI and delete direct flow

**Files:**
- Modify: fe/src/app/(marketing)/buy/{_components/payment-dialogs.tsx,_components/payment-card.tsx,types/buy-view-model.ts,utils/supported-asset-options.ts}
- Modify: fe/src/libs/Env.ts
- Delete: fe/src/app/(marketing)/buy/utils/{buy-checkout-flow.ts,buy-payment-storage.ts}

- [ ] **Step 1: Map assets from backend capabilities**

~~~ts
export function buildSupportedAssetOptions(snapshot: BuySnapshot, capabilities: IPaymentCheckoutCapability[]) {
  return capabilities
    .filter(item => item.enabled)
    .map(item => ({
      id: item.asset,
      code: item.asset,
      chain: item.chain,
      walletProvider: item.walletProvider,
      walletCheckoutEnabled: true,
      decimals: item.decimals,
      usdPrice: getAssetPrice(snapshot, item.asset),
    }));
}
~~~

Remove both public USDT checkout flags from Env.

- [ ] **Step 2: Delete direct UI**

Delete manual address entry, payment URI/QR instructions, Back to wallet, and direct callbacks. Dialog renders connect, preparing, wallet approval, submission recovery, tracking, confirmed, and retryable failure only.

- [ ] **Step 3: Render durable tracking**

Tracking shows txid, chain, status, confirmation count, refresh, and Do not send again. Clear tracking reference only after confirmed query invalidation.

- [ ] **Step 4: Search, then delete obsolete modules**

Run:

~~~bash
rg -n 'buy-checkout-flow|buy-payment-storage|direct_address|direct_instructions|useDirectSend|createDirectPayment|NEXT_PUBLIC_USDT_MANUAL_CHECKOUT_ENABLED' 'fe/src/app/(marketing)/buy' fe/src/libs/Env.ts
~~~

Expected: no matches after deletion with apply_patch.

- [ ] **Step 5: Validate UI**

Run:

~~~bash
cd fe && npx eslint 'src/app/(marketing)/buy/_components/payment-dialogs.tsx' 'src/app/(marketing)/buy/_components/payment-card.tsx' 'src/app/(marketing)/buy/utils/supported-asset-options.ts' 'src/app/(marketing)/buy/types/buy-view-model.ts' src/libs/Env.ts
~~~

Expected: PASS.

## Task 11: Regression coverage and verification

**Files:**
- Modify: be/src/modules/payments/payments.service.spec.ts
- Modify: be/src/modules/payments/services/payment-checkout-capability.service.spec.ts
- Modify: be/src/modules/payments/wallet-action-executors/bitcoin-wallet-action.executor.spec.ts
- Inspect: fe/src/app/(marketing)/buy/**

- [ ] **Step 1: Add final backend regression cases**

Cover exact BTC output plus confirmations, wrong BTC output, wrong Tron contract/sender/receiver/topic/amount, failed Tron receipt, late-paid, post-expiry submission grace, repeated txid submit, and scanner isolation after provider failure.

- [ ] **Step 2: Run backend suite and build**

Run:

~~~bash
cd be && npm test -- payments.service.spec.ts bitcoin-wallet-action.executor.spec.ts payment-checkout-capability.service.spec.ts --runInBand
cd be && npm run build
~~~

Expected: PASS.

- [ ] **Step 3: Run frontend type and build**

Run:

~~~bash
cd fe && npm run check:types
cd fe && npm run build
~~~

Expected: if blocked, list exact user-cleanup files separately; do not alter unrelated modules without direction.

- [ ] **Step 4: Perform controlled wallet checklist**

1. BTC exposes Xverse only and rejects non-mainnet.
2. Xverse approval displays backend-derived BTC receiver and exact sats.
3. TronLink accepts only Tron mainnet and official USDT transfer.
4. Cancellation does not record a payment.
5. Reload after txid receipt resumes submission/tracking without a second payment prompt.
6. Provider indexing delay stays tracking.
7. Persisted status reports confirmation counts.
8. Confirmed BTC and Tron payments appear in admin and portfolio.
9. No manual address, QR, copy/paste, or payment URI checkout is reachable.

## Final verification

- [ ] **Step 1: Check diff and stale direct-send symbols**

Run:

~~~bash
git diff --check
rg -n 'direct_address|direct_instructions|useDirectSend|createDirectPayment|NEXT_PUBLIC_USDT_MANUAL_CHECKOUT_ENABLED' fe/src be/src || true
~~~

Expected: no direct-send references and no whitespace errors.

- [ ] **Step 2: Review without staging**

Run:

~~~bash
git diff --stat
git status --short
~~~

Expected: only checkout/payment/migration/Xverse/spec/plan changes plus user-owned cleanup. Do not stage or commit automatically.
