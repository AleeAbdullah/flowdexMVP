# Buy Production Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore authoritative live pricing and presale statistics on `/buy` while removing failed request loops and reducing initial wallet/navigation work.

**Architecture:** A new `GET /payments/buy-config` endpoint combines the presale database state, checkout capabilities, and cached CoinGecko/fixed-USDT quotes. The frontend consumes it through `/api/public`, maps it directly into the buy view model, and loads Reown only for BTC/TRON selections.

**Tech Stack:** NestJS 11, TypeORM/Postgres, Next.js 16 App Router, React 19, TanStack Query 5, Reown AppKit, Jest, ESLint, TypeScript.

---

### Task 1: Backend buy-config read model

**Files:**
- Modify: `be/src/modules/markets/markets.service.ts`
- Create: `be/src/modules/payments/services/payment-buy-config.service.ts`
- Modify: `be/src/modules/payments/dto/payments.dto.ts`
- Modify: `be/src/modules/payments/payments.module.ts`
- Modify: `be/src/modules/payments/payments.service.ts`
- Modify: `be/src/modules/payments/payments.controller.ts`
- Test: `be/src/modules/payments/services/payment-buy-config.service.spec.ts`

- [ ] Add a public spot-quote method that returns normalized `priceUsd`, `quotedAt`, and `cacheStatus`, while keeping `getCryptoSpotPriceUsd` compatible with existing callers.
- [ ] Write a failing service test with `presale_state`/`presale_tiers` rows, ETH/SOL/BTC quotes, fixed USDT, and checkout capabilities.
- [ ] Implement `PaymentBuyConfigService.getBuyConfig(capabilities)` to query state/tiers once and produce the response DTO.
- [ ] Expose `PaymentsService.getBuyConfig()` and controller `GET /payments/buy-config`.
- [ ] Run `npm test -- --runInBand src/modules/payments/services/payment-buy-config.service.spec.ts` from `be/`; expect PASS.

### Task 2: Single frontend live query

**Files:**
- Modify: `fe/src/api-routes.ts`
- Modify: `fe/src/dal/app/payments/payments.types.ts`
- Modify: `fe/src/dal/app/payments/payments.services.ts`
- Modify: `fe/src/components/flowdex/buy-page-types.ts`
- Modify: `fe/src/components/flowdex/buy-page-market.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/supported-asset-options.ts`
- Modify: `fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`

- [ ] Define the exact buy-config response and add `paymentsService.getBuyConfig()` plus a non-retrying `usePaymentBuyConfig()` query.
- [ ] Replace the four legacy pricing/presale hooks and checkout-capabilities query with the one buy-config query.
- [ ] Map backend values without hardcoded asset or token-price fallbacks.
- [ ] Disable purchase submission and surface a clear error while live configuration is loading or unavailable.
- [ ] Run scoped ESLint and `npm run check:types` from `fe/`; expect no errors.

### Task 3: Lazy wallet runtime and SSR recovery

**Files:**
- Create: `fe/src/app/(marketing)/buy/wallet-adapters/reown-checkout-store.ts`
- Create: `fe/src/app/(marketing)/buy/wallet-adapters/reown-checkout-runtime.tsx`
- Modify: `fe/src/app/(marketing)/buy/_components/buy-page-content.tsx`
- Modify: `fe/src/app/(marketing)/buy/_components/buy-page-client.tsx`
- Modify: `fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- Modify: existing Reown Bitcoin/TRON adapter files as needed

- [ ] Move Reown initialization and AppKit hooks into a dynamically imported null-rendering runtime.
- [ ] Bridge wallet state/actions through a small route-local store; mount the runtime only for BTC/TRON.
- [ ] Remove the whole-page `ssr: false` wrapper so the page shell can render on the server.
- [ ] Build and confirm the large Reown chunk is absent from the default ETH-first startup path.

### Task 4: Bound background work

**Files:**
- Modify: `fe/src/app/(marketing)/buy/hooks/use-buy-checkout-controller.ts`
- Modify: `fe/src/components/flowdex/marketing-nav-client.tsx`
- Modify: `fe/src/components/flowdex/marketing-shell.tsx`
- Modify: `fe/src/components/providers/query-provider.tsx`

- [ ] Track consecutive status failures and stop the interval at three; reset on success.
- [ ] Disable automatic prefetch for duplicated marketing links.
- [ ] Restrict React Query Devtools to development.
- [ ] Run scoped ESLint; expect no errors.

### Task 5: Release verification

**Files:**
- Verify all modified files; no staging or commit.

- [ ] Run backend focused tests and `npm run build` in `be/`.
- [ ] Run `npm run lint`, `npm run check:types`, and `npm run build:next` in `fe/` using npm 11.13.0.
- [ ] Run `git diff --check` and confirm only hotfix/docs files changed.
- [ ] Load `/buy` locally and verify one same-origin buy-config request, no four legacy requests, no repeated failed status polling, and deferred Reown resources until BTC/TRON selection.
