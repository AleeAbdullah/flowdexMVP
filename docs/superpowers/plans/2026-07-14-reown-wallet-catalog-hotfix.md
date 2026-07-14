# Reown Wallet Catalog Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Reown's public WalletConnect catalog from `/buy` while preserving installed Bitcoin connectors and the four configured TRON injected adapters.

**Architecture:** Keep the existing route-local AppKit singleton and checkout hooks. Change only AppKit connection-discovery options so transaction execution, backend-prepared actions, pricing, and presale data remain untouched.

**Tech Stack:** Next.js 16, React 19, TypeScript, Reown AppKit 1.8.22

---

### Task 1: Restrict Reown connection discovery

**Files:**
- Modify: `fe/src/app/(marketing)/buy/wallet-adapters/reown-checkout-appkit.ts`

- [x] **Step 1: Disable the public wallet catalog**

Change the AppKit options to:

```ts
allWallets: 'HIDE',
enableWallets: true,
enableInjected: true,
enableWalletConnect: false,
```

This preserves injected connectors while removing WalletConnect QR/catalog discovery.

- [x] **Step 2: Run focused validation**

Run:

```bash
cd fe
npx eslint 'src/app/(marketing)/buy/wallet-adapters/reown-checkout-appkit.ts'
npm run check:types
```

Expected: both commands exit `0`.

- [x] **Step 3: Run production verification**

Run:

```bash
cd fe
npm run build
```

Expected: the Next.js production build exits `0`.

Then open `/buy`, select BTC and USDT-TRC20, and confirm neither selector contains a WalletConnect QR code or `Search Wallet 40+`.

The build and compiled configuration were verified locally. Interactive selector verification is deferred to the deployment smoke test because localhost cannot load the live pricing/presale API and therefore does not expose BTC or USDT-TRC20 selection.

- [x] **Step 4: Review the final diff**

Run:

```bash
git diff --check
git diff -- fe/src/app/\(marketing\)/buy/wallet-adapters/reown-checkout-appkit.ts
```

Expected: no whitespace errors and only the approved AppKit option changes.
