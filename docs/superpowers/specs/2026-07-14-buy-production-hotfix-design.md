# Buy Production Hotfix Design

## Problem

The production `/buy` page issues four browser requests to backend routes that do not exist (`/pricing`, `/presale/stats`, `/presale/tiers`, and `/presale/config`). The requests go directly to the API origin with non-simple headers, so they preflight; the backend has no matching routes or CORS response, React Query retries each failure, and the UI silently replaces the missing data with hardcoded prices. At the same time, Reown Bitcoin/TRON adapters initialize during the first render, hidden duplicate navigation links prefetch several routes, and payment-status polling continues after repeated failures.

## Approved architecture

Add one public backend read model at `GET /payments/buy-config`. It reads the active presale state and ordered tier data from Postgres, reuses checkout-capability configuration, and attaches cached live USD quotes for every enabled payment asset. The frontend reads it through the existing same-origin `/api/public` proxy, so `/buy` performs one authoritative market request and does not require cross-origin browser access.

The response contains:

- `presale`: current tier, current and next prices, real funds raised, real tokens sold, current tier cap, aggregate cap, and state update time.
- `assets`: checkout capability fields plus `priceUsd`, `quotedAt`, and `cacheStatus` (`fresh`, `cached`, or `fixed`).
- `servedAt`: response creation time.

If the read model cannot provide a valid presale price or an enabled asset quote, it returns a service error. The frontend does not calculate purchases from hardcoded production prices; it shows an unavailable state and disables checkout until the live configuration succeeds.

## Performance and failure controls

- Keep EVM/Account Kit behavior intact, but split the large Reown Bitcoin/TRON runtime behind a dynamic component. It loads only after the buyer selects BTC or USDT TRC20.
- Render the buy content normally instead of wrapping the whole page in an `ssr: false` dynamic import.
- Disable automatic prefetch on duplicated marketing navigation/footer links.
- Render React Query Devtools only in development.
- Stop automatic payment-status polling after three consecutive failures. A successful check resets the failure counter; rate limiting keeps the existing backoff.

## Compatibility and deployment

Checkout intent creation, provider-sent transactions, signed TRON broadcasting, and payment tracking contracts do not change. The backend must deploy before or together with the frontend because the frontend intentionally removes the fake pricing fallback. No database migration or new environment variable is required.

## Verification

Backend tests cover the combined read model, cached/fixed quote metadata, and the controller route. Frontend checks cover the buy-config mapping and supported assets. Release validation includes backend tests/build, frontend lint/type/build under npm 11.13.0, `git diff --check`, and browser/network inspection of `/buy`.
