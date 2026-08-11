# Full Worktree Release Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the complete current FlowDex worktree buildable, testable, and deployment-ready without restoring any intentionally deleted source file or dependency.

**Architecture:** Repair forward from the reduced frontend dependency and source surface. Keep the unified wallet-action checkout lifecycle, reconnect the existing WalletConnect capability guard to the EVM path, repair the backend quote-currency regression, and validate the entire backend/frontend release snapshot before any staging or deployment.

**Tech Stack:** Next.js 16, React 19, TypeScript, Account Kit, Wagmi, Zustand, NestJS, TypeORM, Jest, ESLint, Knip, npm 11.

**Repository constraint:** Work in the existing dirty worktree because that worktree is the release scope. Do not run `git add`, `git commit`, `git push`, or deployment commands during implementation.

---

### Task 1: Normalize the frontend dependency graph

**Files:**
- Modify: `fe/next.config.ts`
- Modify: `fe/package.json`
- Regenerate: `fe/package-lock.json`

- [ ] **Step 1: Record the current production-build failure**

Run:

```bash
cd fe
npm run build
```

Expected: FAIL with attempted-import errors for `zustand` and `@solana/kit` originating from `transpilePackages` dependencies.

- [ ] **Step 2: Remove the package-transpilation workaround**

Delete this complete block from `fe/next.config.ts`:

```ts
transpilePackages: [
  '@account-kit/core',
  '@account-kit/react',
  '@coinbase/cdp-sdk',
  '@solana-program/system',
  '@solana/kit',
  'zustand',
],
```

Account Kit and its nested Solana/Zustand dependencies publish compiled package entrypoints. Forcing all nested versions through Next transpilation makes webpack resolve incompatible exports together.

- [ ] **Step 3: Align direct Wagmi packages and remove unused packages**

Update the relevant `fe/package.json` entries to this shape:

```json
{
  "scripts": {
    "dev:next": "next dev --port 3003"
  },
  "dependencies": {
    "@wagmi/core": "2.22.1",
    "wagmi": "2.19.5",
    "zustand": "5.0.11"
  }
}
```

Keep the other live scripts and dependencies unchanged. Remove:

```json
"dev:spotlight": "npm exec -- @spotlightjs/spotlight"
```

Remove these package entries:

```json
"qrcode.react": "^4.2.0"
"@spotlightjs/spotlight": "^4.10.0"
```

`wagmi@2.19.5` depends on `@wagmi/core@2.22.1`; using the same direct core version prevents two application-facing core instances. `qrcode.react` and Spotlight have no remaining live consumer.

- [ ] **Step 4: Regenerate the lockfile with the declared npm version**

Run:

```bash
cd fe
npx --yes npm@11.13.0 install --package-lock-only --include=dev
```

Expected: PASS and update only `package-lock.json` based on the reduced manifest.

- [ ] **Step 5: Verify a clean install from the lockfile**

Run:

```bash
cd fe
rm -rf node_modules
npx --yes npm@11.13.0 ci --include=dev --foreground-scripts
npm ls zustand @account-kit/react @solana/kit @wagmi/core wagmi --all
```

Expected: install PASS; `npm ls` exits successfully; the direct `@wagmi/core` is `2.22.1`; no invalid peer dependency is reported.

---

### Task 2: Finish the intentional frontend source cleanup

**Files:**
- Modify: `fe/scripts/build-static-hostinger.mjs`
- Modify: `fe/src/app/(marketing)/buy/_components/payment-card.tsx`
- Modify: `fe/src/app/(marketing)/buy/_components/payment-dialogs.tsx`
- Modify: `fe/src/app/(marketing)/buy/constants/tronlink.ts`
- Modify: `fe/src/app/(marketing)/buy/core/checkout-machine.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/buy-display.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/buy-transaction.types.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/supported-asset-options.ts`
- Modify: `fe/src/app/(marketing)/buy/wallet-adapters/xverse-checkout-wallet-adapter.ts`
- Modify: `fe/src/components/flowdex/wallet-connector-icon.tsx`
- Modify: `fe/src/components/ui/world-map.tsx`
- Modify: `fe/src/dal/app/payments/payments.services.ts`
- Modify: `fe/src/icons.ts`

- [ ] **Step 1: Replace the remaining console warning**

Replace the static-build rejection handler with:

```js
main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
```

This preserves command failure and diagnostics without restoring a logger dependency.

- [ ] **Step 2: Use `next/image` for the three live image sites**

Add:

```ts
import Image from 'next/image';
```

In `payment-card.tsx`, replace the asset `<img>` with:

```tsx
<Image
  src={iconSrc}
  alt=""
  width={20}
  height={20}
  className="h-5 w-5 shrink-0"
  aria-hidden="true"
  unoptimized
/>
```

In `wallet-connector-icon.tsx`, replace the connector `<img>` with:

```tsx
<Image
  src={src}
  alt=""
  width={size}
  height={size}
  className={cn('h-5 w-5 shrink-0 object-contain', props.className)}
  aria-hidden="true"
  unoptimized
/>
```

In `world-map.tsx`, replace the generated SVG `<img>` with:

```tsx
<Image
  alt="world map"
  className="pointer-events-none h-full w-full select-none opacity-90 mix-blend-screen [mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.78),white_14%,white_90%,rgba(255,255,255,0.64))]"
  draggable={false}
  height={495}
  src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
  width={1056}
  unoptimized
/>
```

- [ ] **Step 3: Resolve the direct lint warnings**

Add braces around both early returns in the toast effects:

```ts
if (lastIssueRef.current === key) {
  return;
}
```

```ts
if (!message || previous.current === message) {
  return;
}
```

Merge the two imports from `payments.types` in `supported-asset-options.ts` so `IPaymentCheckoutCapability` is imported from the existing type import block.

Remove `IPaymentIntentPublic` from the import list in `payments.services.ts`.

- [ ] **Step 4: Remove only exports proven unused by Knip**

Make `WalletCheckoutStage`, `WalletCheckoutState`, and `WalletCheckoutEvent` file-local types in `checkout-machine.ts` by removing their `export` keywords.

Make `XverseCheckoutWalletState` file-local in `xverse-checkout-wallet-adapter.ts`.

Remove these unused declarations:

```ts
TRON_MAINNET_CHAIN_ID_DECIMAL
normalizeOptionalAddress
validateSenderAddress
BuyExecutionReadiness
BuyProviderAccountSnapshot
```

Keep `UnsupportedReason`, `EvmExecutionReadiness`, and `BuyWalletProvider` because the WalletConnect capability gate uses them.

Remove `Copy` from both the Lucide import and export list in `src/icons.ts`. Keep `Home`, because the live not-found page imports it.

- [ ] **Step 5: Verify lint before moving to checkout behavior**

Run:

```bash
cd fe
npm run lint
npm run check:types
```

Expected: both commands PASS with zero errors and zero warnings.

---

### Task 3: Reconnect WalletConnect capability validation to EVM checkout

**Files:**
- Modify: `fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/walletconnect-session-capabilities.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/buy-transaction.types.ts`

- [ ] **Step 1: Import the existing capability boundary**

Add these imports to the controller:

```ts
import { getWalletConnectSessionCapabilities } from '../utils/walletconnect-session-capabilities';
import type { BuyWalletProvider, UnsupportedReason } from '../utils/buy-transaction.types';
```

- [ ] **Step 2: Add explicit unsupported-reason messages**

Add this controller-local mapping:

```ts
const evmCheckoutUnsupportedMessages: Record<UnsupportedReason, string> = {
  missing_provider: 'A compatible wallet provider is not available for checkout.',
  unsupported_injected_provider: 'This injected wallet cannot send this checkout transaction.',
  unsupported_walletconnect_session: 'This WalletConnect session is not approved for the active account and network.',
  inconclusive_walletconnect_session: 'Reconnect WalletConnect so FlowDex can verify its transaction permissions.',
  missing_walletconnect_eth_sendTransaction: 'This WalletConnect wallet did not approve transaction sending.',
  missing_switch_chain: 'This wallet cannot switch to the required checkout network.',
  wrong_chain: 'Switch to the required checkout network before continuing.',
  account_mismatch: 'The connected wallet account changed. Reconnect and verify it again.',
  provider_disconnected: 'The wallet disconnected before checkout could continue.',
};
```

- [ ] **Step 3: Gate WalletConnect before verification and intent creation**

Add this function inside `useBuyCheckoutController`:

```ts
async function assertEvmCheckoutProviderReady(requiredChainId: number) {
  const connector = marketingWallet.providerAccount.connector;
  if (!connector) {
    throw new Error(evmCheckoutUnsupportedMessages.missing_provider);
  }

  const provider = await connector.getProvider().catch(() => null) as BuyWalletProvider | null;
  if (!provider || typeof provider.request !== 'function') {
    throw new Error(evmCheckoutUnsupportedMessages.missing_provider);
  }

  if (walletProvider.connectorKind !== 'walletconnect') {
    return;
  }

  const readiness = getWalletConnectSessionCapabilities({
    provider,
    activeAddress: walletProvider.address,
    activeChainId: walletProvider.chainId,
    requiredChainId,
  });

  if (readiness.status !== 'ready') {
    throw new Error(evmCheckoutUnsupportedMessages[readiness.reason]);
  }
}
```

Call it immediately after the existing EVM connected-wallet guard and before `dispatch({ type: 'CONNECTING' })`:

```ts
await assertEvmCheckoutProviderReady(requiredChainId);
```

This prevents a WalletConnect session with missing method/account/chain approval from creating an intent or reaching wallet verification.

- [ ] **Step 4: Validate the checkout boundary statically**

Run:

```bash
cd fe
npx eslint 'src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts' 'src/app/(marketing)/buy/utils/walletconnect-session-capabilities.ts' 'src/app/(marketing)/buy/utils/buy-transaction.types.ts'
npm run check:types
npm run check:deps
```

Expected: all commands PASS; Knip no longer reports `walletconnect-session-capabilities.ts` or its capability types as unused.

---

### Task 4: Migrate the deprecated Next.js middleware convention

**Files:**
- Delete: `fe/src/middleware.ts`
- Create: `fe/src/proxy.ts`

- [ ] **Step 1: Move the admin guard to the Next.js 16 proxy convention**

Create `fe/src/proxy.ts` with the same guard and matcher, renaming only the exported function:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth.cookie';
import { sanitizeAppRedirectPath } from '@/lib/auth-redirect';

function isAdminPath(pathname: string) {
  return pathname === '/app/admin' || pathname.startsWith('/app/admin/');
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    const redirectUrl = new URL('/login', request.url);
    const safeNext = sanitizeAppRedirectPath(`${pathname}${request.nextUrl.search}`);

    if (safeNext !== '/app') {
      redirectUrl.searchParams.set('next', safeNext);
    }

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/admin/:path*'],
};
```

Delete `fe/src/middleware.ts` after the proxy file exists.

- [ ] **Step 2: Verify the production build has no middleware warning**

Run:

```bash
cd fe
npm run build
```

Expected: PASS with no middleware-to-proxy deprecation warning and no Zustand/Solana attempted-import errors.

---

### Task 5: Repair the backend quote-currency regression

**Files:**
- Modify: `be/src/modules/markets/markets.service.ts`
- Test: `be/src/modules/markets/markets.service.spec.ts`

- [ ] **Step 1: Preserve the failing regression test**

Run:

```bash
cd be
npm test -- --runInBand src/modules/markets/markets.service.spec.ts
```

Expected: FAIL because `{ quote: 'zzz' }` is silently replaced with `usd`, causing a provider request and `ServiceUnavailableException`.

- [ ] **Step 2: Normalize the requested quote instead of overwriting it**

Replace:

```ts
const quoteCurrency = DEFAULT_QUOTE_CURRENCY;
```

with:

```ts
const quoteCurrency = this.normalizeQuoteCurrency(query.quote);
```

This restores validation before market-data fetching while retaining the existing default for missing/blank quote values.

- [ ] **Step 3: Run the focused market tests**

Run:

```bash
cd be
npm test -- --runInBand src/modules/markets/markets.service.spec.ts
```

Expected: PASS, including the unsupported-quote assertion and one fetch call for the supported-currency list.

---

### Task 6: Verify backend wallet checkout and migration integrity

**Files:**
- Verify: `be/src/modules/payments/**/*.ts`
- Verify: `be/src/infrastructure/database/migrations/1783900800000-WalletCheckoutCapabilityAndBitcoinActions.ts`

- [ ] **Step 1: Run checkout-focused tests**

Run:

```bash
cd be
npm test -- --runInBand \
  src/modules/payments/payments.service.spec.ts \
  src/modules/payments/services/payment-checkout-capability.service.spec.ts \
  src/modules/payments/wallet-action-executors/bitcoin-wallet-action.executor.spec.ts \
  src/modules/payments/services/solana-payment-execution.service.spec.ts
```

Expected: four suites PASS.

- [ ] **Step 2: Run the full backend suite and production build**

Run:

```bash
cd be
npm test -- --runInBand
npm run build
```

Expected: all nine Jest suites PASS and Nest build exits successfully.

- [ ] **Step 3: Verify migration compilation and discovery**

Run:

```bash
cd be
test -f dist/infrastructure/database/migrations/1783900800000-WalletCheckoutCapabilityAndBitcoinActions.js
rg -n "checkout_token_hash|IDX_payment_wallet_actions_btc_tx_unique" \
  dist/infrastructure/database/migrations/1783900800000-WalletCheckoutCapabilityAndBitcoinActions.js
```

Expected: compiled migration exists and contains both the checkout token column and BTC transaction uniqueness index.

- [ ] **Step 4: Confirm manual/direct-send checkout is absent**

Run:

```bash
rg -n -i "direct send|send manually|manual payment|copy.*address" \
  'fe/src/app/(marketing)/buy' \
  be/src/modules/payments
```

Expected: no manual/direct-send checkout branch. Status copy mentioning payment instructions is acceptable only when it does not display a treasury address or instruct a manual transfer.

---

### Task 7: Run complete frontend and repository release gates

**Files:**
- Verify: entire worktree

- [ ] **Step 1: Run the complete frontend validation sequence**

Run:

```bash
cd fe
npm run check:types
npm run lint
npm run check:deps
npm run build
```

Expected: all four commands PASS. ESLint reports zero warnings; Knip reports no unused files, dependencies, exports, or types; Next production build completes.

- [ ] **Step 2: Validate the static artifact only if the script remains supported**

Because `build:static` remains in `package.json`, run:

```bash
cd fe
npm run build:static
```

Expected: PASS and create `fe/out`. Any failure must identify an actual dynamic route incompatible with the retained deployment script; do not restore deleted tooling to satisfy it.

- [ ] **Step 3: Validate repository integrity**

Run:

```bash
git diff --check
git ls-files -u
rg -n "^(<<<<<<<|=======|>>>>>>>)" be fe \
  --glob '!**/node_modules/**' \
  --glob '!**/.next/**'
```

Expected: no whitespace errors, no unresolved index entries, and no conflict markers.

- [ ] **Step 4: Confirm every live import resolves inside the release snapshot**

Run:

```bash
cd fe
npm run check:types
cd ../be
npm run build
```

Expected: PASS. These two compilers are the authoritative import-resolution check for untracked runtime files that must be included in the eventual release.

- [ ] **Step 5: Produce the deployment-readiness handoff**

Report:

- frontend type, lint, Knip, production-build, and static-build results;
- backend focused tests, full tests, build, and migration-discovery results;
- the exact remaining staged, unstaged, and untracked release files;
- confirmation that nothing was staged, committed, pushed, or deployed;
- any warning that remains, including the exact command and why it is non-blocking.

Do not proceed to staging or deployment until the user explicitly approves the verified release snapshot.
