# FlowDex Theme Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the FlowDex design system across dark and light themes, stop third-party wallet CSS from overriding the application, and make the Account Kit and Reown wallet modals look and behave like part of FlowDex.

**Architecture:** Fix the global cascade at its source, then map third-party theming APIs to the existing FlowDex tokens. Add only the missing semantic tokens, update shared primitives before route-local exceptions, and finish with decorative surfaces and interaction states. Wallet connection and transaction execution behavior must remain unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, `next-themes`, Alchemy Account Kit, Reown AppKit, ESLint, TypeScript, Next production build.

---

## Scope and guardrails

- This plan covers theme consistency, responsive visibility, third-party wallet presentation, semantic feedback colors, and focus styling under `fe/`.
- Preserve every existing worktree change. The backend payment/TRON changes, dependency updates, deletions, and cleanup are intentional and out of scope for this theme pass.
- Do not change BTC, TRON, or EVM payment execution, wallet capability checks, wallet selection rules, API payloads, or production environment requirements.
- Do not add a test runner, Storybook, Playwright, or another styling library. Dependency cleanup is intentional.
- Do not fix the cascade with per-component `!important` rules. Isolate the vendor stylesheet once.
- Prefer the existing FlowDex tokens and shared primitives. Add a token only when one semantic concept is reused or must vary between dark and light.
- Do not stage or commit automatically. The normal plan-template commit checkpoints are intentionally omitted because the repository workflow requires the user to control staging.

## Current failure model

The implementation must address the failures in this order:

1. `@account-kit/react/styles.css` is imported globally and unlayered from `app/layout.tsx`. Its Tailwind preflight and generic utilities override FlowDex buttons, inputs, responsive `hidden`/`flex` utilities, font weights, padding, and backgrounds.
2. The Account Kit modal has no FlowDex modal class and defaults to vendor pink/dark variables.
3. Reown AppKit is initialized with `themeMode: 'dark'`, so the BTC wallet selector ignores light mode.
4. `--buy-stage-muted` is referenced but undefined.
5. Shared statuses, alerts, and several errors use dark-only Tailwind colors.
6. Landing artwork and map surfaces contain fixed dark artwork colors that do not adapt to light mode.
7. Several raw interactive buttons lack a visible keyboard focus state.

The cascade fix is a hard gate. Do not evaluate later visual work until Task 2 passes, because the unlayered vendor CSS makes all downstream screenshots and computed-style checks unreliable.

## Task 1: Capture the regression baseline and protect the dirty worktree

**Files:**

- Read only: `fe/src/app/layout.tsx`
- Read only: `fe/src/styles/global.css`
- Read only: `fe/src/components/providers/alchemy-provider.tsx`
- Read only: `fe/src/app/(marketing)/buy/wallet-adapters/bitcoin-appkit-checkout-wallet.ts`
- Read only: current `git status --short`

- [ ] Record `git status --short` before editing and retain it for the final diff review.
- [ ] Start the frontend with the repository's existing local command and open `/`, `/buy`, and `/login` in the in-app browser.
- [ ] At a desktop viewport around `1440x900`, confirm the current broken state before changing code:
  - the desktop navigation is hidden or the hamburger remains visible;
  - the primary buy/connect button has a transparent background or lost padding/font weight;
  - login inputs or submit buttons have vendor-reset padding/backgrounds.
- [ ] Capture these computed-style baselines in browser devtools:

```text
Primary brand button:
  background-image
  background-color
  font-weight
  padding-left / padding-right

Text input:
  padding-left / padding-right

Desktop nav and hamburger:
  display
```

- [ ] Confirm that opening the mobile menu changes state but currently fails to reveal all expected links and the theme toggle.
- [ ] Confirm `getComputedStyle(document.documentElement).getPropertyValue('--buy-stage-muted')` is empty.
- [ ] Do not save screenshots or generated artifacts inside the repository unless the user explicitly asks for them.

**Gate:** The baseline must reproduce the cascade failure. If it does not, check the active dev server, current branch, and cache before editing.

## Task 2: Isolate Account Kit CSS from the FlowDex cascade

**Files:**

- Modify: `fe/src/app/layout.tsx`
- Modify: `fe/src/styles/global.css`

- [ ] Remove the raw Account Kit stylesheet import from `layout.tsx`:

```ts
// Remove this line from layout.tsx
import '@account-kit/react/styles.css';
```

- [ ] Keep `import '@/styles/global.css';` as the only application stylesheet import in the root layout.
- [ ] Change the first lines of `global.css` so the third-party stylesheet is explicitly lower priority than FlowDex/Tailwind layers:

```css
@layer account-kit, theme, base, components, utilities;

@import '@account-kit/react/styles.css' layer(account-kit);
@import 'tailwindcss';
```

- [ ] Keep both `@import` statements at the top of the stylesheet; do not place normal rules before them.
- [ ] Do not copy Account Kit CSS into the repository and do not patch vendor files under `node_modules`.
- [ ] Restart the dev server so the Tailwind/CSS pipeline rebuilds the layer order from a clean state.
- [ ] Recheck the baseline pages and confirm:
  - FlowDex button gradients/backgrounds return;
  - expected horizontal padding returns on buttons and inputs;
  - expected bold/black font weights return;
  - desktop `hidden lg:flex` navigation computes to `display:flex`;
  - desktop `lg:hidden` hamburger computes to `display:none`;
  - mobile navigation links and the theme toggle become visible after opening the menu.
- [ ] Run the first validation gate:

```bash
cd fe
npx eslint 'src/app/layout.tsx'
npm run check:types
```

**Expected result:** Account Kit remains usable, but its preflight and generic utilities no longer override application utilities. If the embedded Account Kit buttons regress, correct only the existing `.flowdex-account-kit*` component rules after confirming the cascade is fixed.

## Task 3: Theme the Alchemy Account Kit modal through its supported API

**Files:**

- Modify: `fe/src/components/providers/alchemy-provider.tsx`
- Modify: `fe/src/styles/global.css`

- [ ] Add a stable modal class to the second `createConfig` argument:

```ts
{
  auth: {
    sections: [[{
      type: 'external_wallets',
      ...externalWalletConfig.uiConfig,
    }]],
  },
  modalBaseClassName: 'flowdex-account-kit-modal',
}
```

- [ ] Inspect the rendered portal once to confirm whether `flowdex-account-kit-modal` lands on the modal root or a parent. Scope all modal overrides to that class and avoid selectors tied to generated element IDs.
- [ ] Add a variable bridge in `global.css` for the modal. Map Account Kit semantics to FlowDex semantics rather than hardcoding vendor colors:

```css
.flowdex-account-kit-modal {
  --akui-active: var(--accent-strong);
  --akui-static: var(--card-border);
  --akui-critical: var(--feature-red);
  --akui-btn-primary: var(--accent-strong);
  --akui-btn-secondary: var(--card-bg-strong);
  --akui-btn-auth: var(--card-bg-strong);
  --akui-fg-primary: var(--text);
  --akui-fg-secondary: var(--muted);
  --akui-fg-tertiary: var(--muted);
  --akui-fg-invert: var(--bg);
  --akui-fg-btn-primary: var(--primary-foreground-solid);
  --akui-fg-disabled: color-mix(in srgb, var(--muted) 55%, transparent);
  --akui-fg-accent-brand: var(--accent-strong);
  --akui-fg-critical: var(--feature-red);
  --akui-fg-success: var(--green);
  --akui-bg-surface-default: var(--surface-elevated);
  --akui-bg-surface-subtle: var(--card-bg-strong);
  --akui-bg-surface-inset: var(--bg-2);
  --akui-bg-surface-critical: color-mix(in srgb, var(--feature-red) 14%, var(--surface-elevated));
  --akui-bg-surface-error: color-mix(in srgb, var(--feature-red) 14%, var(--surface-elevated));
  --akui-bg-surface-success: color-mix(in srgb, var(--green) 12%, var(--surface-elevated));
  --akui-bg-surface-warning: color-mix(in srgb, var(--feature-gold) 14%, var(--surface-elevated));
}
```

- [ ] Preserve the existing `.flowdex-account-kit-shell` and `.flowdex-account-kit` rules used by the embedded auth card. Do not introduce another provider or wrapper component.
- [ ] Open the EVM wallet selector in dark mode and verify:
  - the vendor pink `#f6c` is gone;
  - primary actions use FlowDex cyan;
  - text, surface, border, disabled, error, and success colors are legible.
- [ ] Switch to light mode while the modal is open, or close and reopen it, and verify the modal uses the current FlowDex light tokens.
- [ ] Run:

```bash
cd fe
npx eslint 'src/components/providers/alchemy-provider.tsx'
npm run check:types
```

**Gate:** Account Kit must still connect the same configured EVM wallets. This task changes presentation only.

## Task 4: Synchronize the Reown BTC modal with `next-themes`

**Files:**

- Modify: `fe/src/app/(marketing)/buy/wallet-adapters/bitcoin-appkit-checkout-wallet.ts`

- [ ] Keep `createAppKit` at module scope and preserve its one-time initialization, adapters, project ID, network, metadata, features, and wallet capability configuration.
- [ ] Import `useEffect`, `useTheme`, and `useAppKitTheme` in the existing adapter file:

```ts
import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  createAppKit,
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitTheme,
  useDisconnect,
  useWalletInfo,
} from '@reown/appkit/react';
```

- [ ] Retain `themeMode: 'dark'` as the deterministic pre-hydration default, then synchronize after mount inside `useBitcoinAppKitCheckoutWallet`:

```ts
const { resolvedTheme } = useTheme();
const { setThemeMode, setThemeVariables } = useAppKitTheme();

useEffect(() => {
  const mode = resolvedTheme === 'light' ? 'light' : 'dark';
  setThemeMode(mode);
  setThemeVariables({
    '--apkt-font-family': 'var(--font-dm-sans), "DM Sans", sans-serif',
    '--apkt-accent': 'var(--accent-strong)',
    '--apkt-color-mix': 'var(--bg)',
    '--apkt-color-mix-strength': 20,
    '--apkt-font-size-master': '9px',
    '--apkt-border-radius-master': '3px',
    '--apkt-qr-color': 'var(--accent-strong)',
  });
}, [resolvedTheme, setThemeMode, setThemeVariables]);
```

- [ ] If Reown does not resolve the document-level CSS variables inside its rendered root, replace only `--apkt-accent`, `--apkt-color-mix`, and `--apkt-qr-color` with explicit dark/light values selected from the existing FlowDex token definitions. Do not invent a third palette.
- [ ] Do not change `openSelector`, `disconnect`, `sendPreparedAction`, namespace selection, satoshi validation, or provider readiness logic.
- [ ] Browser-check the BTC selector in both themes:
  - opening BTC uses the matching dark/light Reown theme;
  - changing the site theme and reopening the selector changes Reown too;
  - Xverse/WalletConnect discovery still appears according to the current configuration;
  - the console has no duplicate AppKit initialization warning;
  - the earlier `publishCustom is not a function` error does not reappear.
- [ ] Run:

```bash
cd fe
npx eslint 'src/app/(marketing)/buy/wallet-adapters/bitcoin-appkit-checkout-wallet.ts'
npm run check:types
```

**Gate:** BTC connect/send behavior must be byte-for-byte equivalent outside theme synchronization.

## Task 5: Complete the semantic token set and fix shared feedback primitives

**Files:**

- Modify: `fe/src/styles/global.css`
- Modify: `fe/src/components/flowdex/primitives.tsx`
- Modify: `fe/src/components/ui/alert.tsx`
- Modify: `fe/src/components/flowdex/marketing-shell.tsx`

- [ ] Add `--buy-stage-muted` to both dark and light token blocks. It must be a visible but subdued solid/surface color, not transparent:

```css
--buy-stage-muted: color-mix(in srgb, var(--muted) 16%, var(--bg-2));
```

- [ ] Add shared feedback tokens to both dark and light token blocks. Use the existing feature colors as the source hues and tune contrast separately per theme:

```css
--status-info-text: ...;
--status-info-surface: ...;
--status-info-border: ...;
--status-success-text: ...;
--status-success-surface: ...;
--status-success-border: ...;
--status-warning-text: ...;
--status-warning-surface: ...;
--status-warning-border: ...;
--status-error-text: ...;
--status-error-surface: ...;
--status-error-border: ...;
--status-neutral-text: ...;
--status-neutral-surface: ...;
--status-neutral-border: ...;
```

- [ ] Meet at least WCAG AA contrast for normal-size error/help copy against its surface. Do not assume a pale `*-100` color remains readable on light backgrounds.
- [ ] Replace `statusToneMap` values in `primitives.tsx` with semantic token utilities. Map statuses consistently:
  - waiting, underpaid, overpaid, late paid, pending, submitted -> warning;
  - detected, confirming, approved, sent -> info;
  - confirmed -> success;
  - failed -> error;
  - expired, dropped, unknown fallback -> neutral.
- [ ] Update the shared `Alert` destructive variant to use the error text/surface/border variables instead of dark-only red classes.
- [ ] Remove `text-emerald-300` from the success `Badge` in `marketing-shell.tsx`; let `variant="success"` own its semantic presentation.
- [ ] Confirm the 12-month cliff segment on `/buy` now has a non-transparent muted surface in both themes.
- [ ] Verify status pills and destructive alerts on transaction/admin screens in both themes.
- [ ] Run:

```bash
cd fe
npx eslint 'src/components/flowdex/primitives.tsx' 'src/components/ui/alert.tsx' 'src/components/flowdex/marketing-shell.tsx'
npm run check:types
```

## Task 6: Replace route-level dark-only feedback colors

**Files:**

- Modify: `fe/src/components/flowdex/marketing-wallet-nav-control.tsx`
- Modify: `fe/src/components/flowdex/auth/auth-error-banner.tsx`
- Modify: `fe/src/components/flowdex/auth/auth-fields.tsx`
- Modify: `fe/src/components/flowdex/landing-newsletter-form.tsx`
- Modify: `fe/src/app/app/error.tsx`
- Modify: `fe/src/app/app/admin/transactions/[id]/error.tsx`
- Modify: `fe/src/app/app/admin/transactions/_components/admin-transactions-list.tsx`
- Modify: `fe/src/app/(marketing)/transactions/_components/wallet-transactions-page-client.tsx`
- Modify: `fe/src/app/(marketing)/transaction/[id]/_components/wallet-transaction-detail-page-client.tsx`

- [ ] Replace fixed `text-amber-100`, `text-rose-100`, `text-rose-200`, and `text-rose-300` with the status semantic variables from Task 5.
- [ ] For containers, replace the surface and border at the same time. Do not change only the text color and leave a mismatched dark surface.
- [ ] Keep route-local markup local. Reuse `Alert` only where doing so reduces code and preserves the current spacing; do not create a new wrapper for every error message.
- [ ] Preserve all current copy, roles, IDs, `aria-describedby` wiring, and request/retry behavior.
- [ ] Inspect the remaining fixed light/dark text hits with:

```bash
cd fe
rg -n "text-(amber|cyan|sky|emerald|rose|red|slate)-(100|200|300)" src/app src/components
```

- [ ] Review each remaining result. Leave a color only when it is a deliberate brand/art color rather than semantic body text, and document that choice in the implementation handoff.
- [ ] Run scoped ESLint for every modified path and `npm run check:types`.

## Task 7: Make decorative landing and buy visuals theme-aware

**Files:**

- Modify: `fe/src/styles/global.css`
- Modify: `fe/src/components/flowdex/landing-hero-carousel.tsx`
- Modify: `fe/src/components/flowdex/landing-hero-visuals.tsx`
- Modify: `fe/src/components/ui/cobe-globe-interactive.tsx`
- Modify: `fe/src/components/ui/world-map.tsx`
- Modify: `fe/src/app/(marketing)/buy/_components/buy-page-content.tsx`

- [ ] Add a small set of artwork tokens with dark and light values:

```css
--visual-glass-surface: ...;
--visual-glass-surface-strong: ...;
--visual-glass-border: ...;
--visual-orbit-border: ...;
--visual-control-surface: ...;
--visual-deep-shadow: ...;
--buy-progress-gradient: ...;
```

- [ ] Replace repeated fixed `border-white/*`, white-to-transparent glass gradients, dark RGBA card surfaces, and black-only shadows in the hero carousel/visuals with those tokens.
- [ ] Preserve the visual hierarchy: foreground cards must remain more opaque than background decoration, orbit lines must remain subtle, and text must continue using `--text`/`--muted`.
- [ ] Replace the hardcoded buy progress cyan/blue gradient with `var(--buy-progress-gradient)`, with separate dark/light token values.
- [ ] Update `cobe-globe-interactive.tsx` tooltip/card surfaces to use the same adaptive artwork tokens.
- [ ] Treat `WorldMap` separately because its SVG is generated from a raw color string:
  - do not pass an unresolved CSS variable to `DottedMap.getSVG` unless the library is verified to preserve it;
  - expose or reuse explicit light/dark map color values in the existing client-side theme flow;
  - switch the map blend class from a fixed `mix-blend-screen` to a theme-aware class or prop;
  - keep the existing line animation, projection, and geometry untouched.
- [ ] Check the complete landing hero at desktop and mobile sizes in both themes. Watch for washed-out light surfaces, invisible borders, excessive shadows, and text contrast.
- [ ] Run scoped ESLint and `npm run check:types`.

**Gate:** Decorative changes must not alter layout dimensions, carousel timing, animation sequencing, map points, or globe interaction.

## Task 8: Restore consistent keyboard focus and control states

**Files:**

- Modify: `fe/src/app/(marketing)/buy/_components/payment-card.tsx`
- Modify: `fe/src/app/(marketing)/buy/_components/buy-page-content.tsx`
- Modify: `fe/src/app/app/admin/transactions/_components/admin-transaction-row.tsx`
- Review: other raw `<button>` elements found under `fe/src/app` and `fe/src/components`

- [ ] Prefer the shared `Button` primitive where it fits without changing layout or behavior.
- [ ] For deliberately custom raw buttons, add the existing FlowDex focus treatment:

```text
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-[var(--accent-strong)]
focus-visible:ring-offset-2
focus-visible:ring-offset-[var(--bg)]
```

- [ ] Give buy-page tab controls `aria-pressed` or `aria-selected` consistent with their existing role/structure so active state is not color-only.
- [ ] Preserve disabled behavior, event handlers, full-row click targets, and button types.
- [ ] Keyboard-test in both themes:
  - tab through header controls, payment selector, amount input, buy/connect action, tabs, and admin transaction rows;
  - every interactive control has a visible focus indicator;
  - focus rings do not clip at card/dialog boundaries;
  - Enter/Space behavior remains unchanged.
- [ ] Run scoped ESLint and `npm run check:types`.

## Task 9: Full verification matrix and handoff

**Files:**

- Review only: all files changed by Tasks 2-8
- Review only: current `git diff` and `git status --short`

- [ ] Run frontend static validation:

```bash
cd fe
npm run lint
npm run check:types
npm run build:next
```

- [ ] If repository-wide lint/type/build failures occur, separate pre-existing failures from theme-pass failures. Fix only failures introduced by this plan unless the user expands scope.
- [ ] Verify this browser matrix:

| Route/flow | 1440x900 dark | 1440x900 light | 390x844 dark | 390x844 light |
|---|---:|---:|---:|---:|
| Landing/header | [ ] | [ ] | [ ] | [ ] |
| Mobile menu | N/A | N/A | [ ] | [ ] |
| `/buy` base UI | [ ] | [ ] | [ ] | [ ] |
| EVM Account Kit modal | [ ] | [ ] | [ ] | [ ] |
| BTC Reown modal | [ ] | [ ] | [ ] | [ ] |
| `/login` | [ ] | [ ] | [ ] | [ ] |
| Transaction status/error UI | [ ] | [ ] | [ ] | [ ] |
| Admin transaction UI, when authenticated | [ ] | [ ] | [ ] | [ ] |

- [ ] Confirm the critical computed-style assertions:
  - branded button `background-image` is not `none`;
  - expected button `font-weight` is at least `700` where the design calls for bold/black;
  - button and input horizontal padding is greater than zero;
  - desktop nav displays and desktop hamburger is hidden;
  - mobile links and theme toggle display after opening the menu;
  - `--buy-stage-muted` is non-empty and the cliff segment is not transparent;
  - Account Kit primary color is not vendor pink and its surface matches the active theme;
  - Reown modal mode matches the active site theme.
- [ ] Verify both wallet modal flows without sending funds. Do not perform a production transaction as part of visual QA.
- [ ] Check the browser console for:
  - React hydration errors;
  - duplicate AppKit initialization warnings;
  - `WalletConnect Core already initialized`;
  - `publishCustom is not a function`;
  - new CSS or asset loading failures.
- [ ] Run focused residue searches:

```bash
cd fe
rg -n "@account-kit/react/styles.css" src
rg -n "themeMode: 'dark'" 'src/app/(marketing)/buy'
rg -n "text-(amber|cyan|sky|emerald|rose|red|slate)-(100|200|300)" src/app src/components
rg -n "border-white|bg-white|mix-blend-screen|rgba\(7,18,34" src/components/flowdex src/components/ui src/app/'(marketing)'/buy
```

- [ ] Review `git diff --check` and `git diff --stat`.
- [ ] Compare final `git status --short` with the Task 1 baseline. Confirm no existing backend, dependency, wallet, deletion, or cleanup changes were lost or rewritten accidentally.
- [ ] Hand off a concise result grouped as:
  - cascade fix;
  - third-party modal theming;
  - semantic/shared theme fixes;
  - decorative and focus fixes;
  - validation performed;
  - any intentional hardcoded art colors left in place.
- [ ] Leave all files unstaged for user review.

## Completion criteria

The theme recovery is complete only when all of the following are true:

- Account Kit CSS can no longer override FlowDex global buttons, inputs, typography, or responsive utilities.
- Desktop and mobile navigation behave correctly in both themes.
- EVM Account Kit and BTC Reown wallet selectors match the active FlowDex theme.
- The buy button retains its intended branded background, padding, and typography.
- Every referenced theme custom property, including `--buy-stage-muted`, resolves to a value.
- Shared statuses, errors, warnings, and alerts are readable in both light and dark mode.
- Landing artwork and buy visuals adapt without losing hierarchy or changing behavior.
- Custom controls have visible keyboard focus.
- ESLint, type-check, and production build pass, or any unrelated pre-existing blocker is isolated with exact evidence.
- No wallet execution, payment API, backend, dependency-cleanup, or production configuration behavior changed as part of this work.
