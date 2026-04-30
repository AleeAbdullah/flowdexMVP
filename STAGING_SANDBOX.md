# Staging Sandbox: Alchemy Payments Flow

This document defines a safe staging environment for validating wallet linking, payment lifecycle, webhooks, ledger persistence, and admin analytics before production rollout.

## 1. Environment Scope

- Chains: `ETH_SEPOLIA`, `BASE_SEPOLIA`
- Backend: isolated Postgres + isolated Redis + staging env vars
- Frontend: staging env vars pointing to staging backend
- Alchemy: separate staging app + API key + webhook signing key

Never reuse production keys or webhook endpoints in staging.

## 2. Files Added for Staging

- Backend env template: `be/.env.staging.example`
- Frontend env template: `fe/.env.staging.example`
- Staging infra compose: `be/docker-compose.staging.yml`

## 3. One-Time Staging Setup

1. Backend env
- Copy `be/.env.staging.example` to `be/.env.staging`
- Fill:
  - `ALCHEMY_API_KEY`
  - `ALCHEMY_WEBHOOK_SIGNING_KEY`
  - `ALCHEMY_NOTIFY_AUTH_TOKEN` (for webhook management API)
  - `TREASURY_ADDRESS_ETH_SEPOLIA`
  - `TREASURY_ADDRESS_BASE_SEPOLIA`
  - `INTERNAL_AUTH_JWT_SECRET`

2. Frontend env
- Copy `fe/.env.staging.example` to `fe/.env.staging`
- Fill:
  - `NEXT_PUBLIC_ALCHEMY_API_KEY`
  - `NEXT_PUBLIC_API_URL` (staging backend URL)
  - `INTERNAL_AUTH_JWT_SECRET` (must match backend)

3. Start staging infra

```bash
cd be
docker compose -f docker-compose.staging.yml up -d
```

4. Run backend with staging env

```bash
cd be
set -a
source .env.staging
set +a
npm run migration:run
npm run start
```

5. Run frontend with staging env

```bash
cd fe
set -a
source .env.staging
set +a
npm run dev
```


6. set up ngrok
   ```bash
    
   ```

## 4. Webhook Setup (Alchemy)

Create an `ADDRESS_ACTIVITY` webhook in your staging Alchemy app:

- Callback URL:
  - `POST /api/webhooks/alchemy/address-activity`
- Header validation:
  - Backend verifies `x-alchemy-signature` against `ALCHEMY_WEBHOOK_SIGNING_KEY`
- Watch addresses:
  - all staging treasury + staging test user wallets

## 5. Manual Validation Checklist (Staging)

1. Wallet linking
- User signs in via embedded wallet flow
- `POST /wallets/link` stores wallet with network/provider/account IDs
- `GET /wallets` returns only user-owned wallets

2. Payment guardrails
- Simulation blocks when recipient is not treasury for selected network
- Simulation returns tokenized `simulationId`
- Tracking rejects missing/expired/invalid `simulationId`
- Tracking rejects invalid hash format and non-positive amounts

3. Transaction lifecycle
- Tracked tx appears in `GET /transactions`
- Webhook updates status and metadata idempotently
- Backfill cron reconciles missed events via Transfers API

4. Admin reads
- `GET /admin/stats` reflects ledger-backed counts/volume
- `GET /admin/transactions` filters work by status/network/user

5. Security boundaries
- Cross-user wallet/transaction access is denied
- Webhook with bad signature is rejected

## 6. Production Promotion Gate

Promote only when all are true:

- All staging checklist items pass
- Staging webhook duplicate deliveries remain idempotent
- Dashboard/admin numbers match ledger truth set
- No staging keys used in production env
- Production webhook endpoint and signing key configured separately

## 7. Important Current Product Note

Current implementation is ledger-first and simulation-gated. If you want true end-to-end “click pay → chain submission → auto-track” in one action, add a server-backed transaction submission path (Account Kit / wallet API execution) before production cutover.
