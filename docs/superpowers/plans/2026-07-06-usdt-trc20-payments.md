# USDT TRC20 Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add USDT TRC20 as a direct-send payment asset with Alchemy TRON detection and admin visibility.

**Architecture:** Reuse the existing payment intent, scanner, payment persistence, and admin payment list. Add TRON as a chain-specific branch with 6-decimal USDT pricing, TRON address normalization, Alchemy TRON block/log reads, and TRC20 Transfer log matching.

**Tech Stack:** NestJS, TypeORM, Alchemy TRON HTTP API, Next.js App Router, React Query.

---

### Task 1: Backend Payment Model

**Files:**
- Modify: `be/src/modules/payments/payments.types.ts`
- Modify: `be/src/modules/payments/entities/payment-intent.entity.ts`
- Create: `be/src/infrastructure/database/migrations/1783296000000-TronPaymentSupport.ts`
- Modify: `be/src/infrastructure/config/env.ts`

- [x] Add `TRON` and `USDT_TRC20`, 6 decimals, TRON confirmation/env config, and a nullable `tron_created_block_number`.

### Task 2: Alchemy TRON Client

**Files:**
- Modify: `be/src/modules/alchemy/alchemy.service.ts`

- [x] Add methods for latest TRON block number and transaction info by block number using `https://tron-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY/walletsolidity/*`.

### Task 3: TRC20 Matching

**Files:**
- Modify: `be/src/modules/payments/payments.service.ts`
- Test: `be/src/modules/payments/payments.service.spec.ts`

- [x] Match `Transfer(address,address,uint256)` logs where contract, sender, receiver, amount, and block window all match the intent.

### Task 4: Frontend Buy Flow

**Files:**
- Modify: `fe/src/dal/app/payments/payments.types.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/supported-asset-options.ts`
- Modify: `fe/src/app/(marketing)/buy/utils/buy-display.ts`
- Modify: `fe/src/components/flowdex/buy-page-market.ts`
- Modify: `fe/src/components/flowdex/buy-page-content.ts`

- [x] Add `USDT_TRC20` option, TRON labels, 6-decimal formatting, and TRON sender-address validation.

### Task 5: Admin Visibility

**Files:**
- Modify: `fe/src/app/app/admin/transactions/_components/admin-transactions-filters.tsx`

- [x] Update placeholders/examples so admins can filter by `TRON` and `USDT_TRC20`; persisted TRON payments are already returned by the existing admin API.

### Task 6: Verification

**Commands:**
- `cd be && npm test -- payments.service.spec.ts`
- `cd be && npm run build`
- `cd fe && pnpm check:types`
