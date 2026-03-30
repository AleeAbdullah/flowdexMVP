# Crypto Presale Backend Blueprint

This reference is product-specific context for crypto presale backend work. Load it only when the task explicitly calls for wallet verification, on-chain reconciliation, presale pricing, token allocation, refunds, or related blockchain flows.

## Table of Contents

1. Core Identity
2. System Focus
3. Architecture Strategy
4. Module Architecture
5. Transaction Lifecycle
6. Database Architecture
7. Background Jobs
8. Security Architecture
9. Performance Strategy
10. Real-Time Updates
11. Scalability Plan
12. Refund Model
13. DevOps and Monitoring
14. Success Metrics
15. Final Principles

## Core Identity

Design secure, scalable, blockchain-integrated backend systems using NestJS, PostgreSQL, and event-driven patterns. Optimize for financial correctness, multi-chain support, strong integrity between off-chain and on-chain state, and horizontal scalability under bursty presale load.

## System Focus

- Blockchain is the source of financial truth.
- Database is the source of business logic and application state.

## Architecture Strategy

### High-Level Architecture

- Pattern: modular monolith first, microservices later if justified
- Framework: NestJS
- External APIs: REST
- Internal coordination: domain events, Redis, or queue-backed processors
- Data storage: PostgreSQL for transactional data
- Runtime shape: Dockerized services with horizontal scaling

### Design Defaults

- Keep blockchain processors stateless.
- Keep transaction matching idempotent.
- Use queue-backed or retry-safe async work for external I/O.

## Module Architecture

### Auth Module

- JWT-based authentication
- Role-based access for user and admin flows
- Secure password hashing with bcrypt or an equivalent modern password hasher

### Users Module

- Profile management
- Portfolio views derived from confirmed transactions

### Wallet Module

- Multi-chain wallet storage for ETH and TRON
- Signature verification for MetaMask and TronLink style flows
- One wallet per chain per user, enforced by constraint

### Transactions Module

Own creation, persistence, lifecycle transitions, and idempotency.

Default states:

`pending -> detected -> confirming -> confirmed -> failed`

### Blockchain Module

- Listen to blockchain events through RPC providers
- Validate wallet address, amount, token, and chain
- Track confirmations
- Emit normalized events instead of directly applying business policy

### Presale Module

- Tier progression
- Token pricing rules
- Aggregation metrics

Rule:

- Store real values only
- Apply any 10x display multiplier only at the response layer

### Pricing Module

- Fetch crypto prices from CoinGecko or a provider with equivalent reliability
- Store normalized USD values
- Serve hot reads from Redis when available

### Admin Module

- Transaction monitoring
- Manual overrides
- Refund workflows
- Reporting and exports

## Transaction Lifecycle

1. Create a transaction in `pending`.
2. Accept funds to a platform-controlled wallet.
3. Detect the transfer on-chain.
4. Match by wallet address, amount, and chain.
5. Move to `detected`.
6. Track confirmations and move to `confirming`.
7. Move to `confirmed` when confirmation policy is satisfied.
8. Allocate tokens using real values.
9. Update presale aggregates.
10. Emit an event for downstream updates such as WebSocket notifications.

## Database Architecture

### Design Principles

- Prefer ACID guarantees for financial state.
- Enforce idempotency with unique constraints.
- Index critical read paths for dashboards and reconciliation.

### Example Tables

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  address VARCHAR(255) NOT NULL,
  chain VARCHAR(20) NOT NULL,
  UNIQUE(user_id, chain)
);
```

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  tx_hash VARCHAR(255) UNIQUE,
  chain VARCHAR(20),
  currency VARCHAR(20),
  amount_paid NUMERIC,
  tokens_allocated NUMERIC,
  status VARCHAR(20),
  confirmations INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tx_user ON transactions(user_id);
CREATE INDEX idx_tx_status ON transactions(status);
```

```sql
CREATE TABLE presale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_raised_real NUMERIC DEFAULT 0,
  total_tokens_sold_real NUMERIC DEFAULT 0,
  current_tier INT
);
```

```sql
CREATE TABLE tiers (
  id SERIAL PRIMARY KEY,
  price NUMERIC NOT NULL,
  target_amount NUMERIC NOT NULL,
  "order" INT UNIQUE
);
```

```sql
CREATE TABLE pricing (
  symbol VARCHAR(20) PRIMARY KEY,
  price_usd NUMERIC,
  updated_at TIMESTAMP
);
```

## Background Jobs

### Price Updater

- Interval: 30 to 60 seconds
- Source: CoinGecko or equivalent market data provider
- Writes normalized prices to PostgreSQL and optionally Redis

### Transaction Watcher

- Interval: 5 to 10 seconds
- Poll chain activity through RPC
- Emit detection events

### Confirmation Tracker

- Poll confirmations for matched transactions
- Update transaction state through safe guarded transitions

## Security Architecture

### Authentication

- Expiring JWTs
- Optional refresh token workflow

### Wallet Security

- Verify signatures
- Use nonce-based challenges to prevent replay

### API Security

- Rate limiting through NestJS throttling
- Input validation with class-validator or equivalent
- Global exception filters and safe error shaping

### Data Security

- Encrypt sensitive data at rest where appropriate
- Enforce HTTPS
- Store secrets in environment-managed configuration

### Fraud Prevention

- Prevent duplicate transaction hashes
- Enforce minimum thresholds where the business requires them
- Validate chain and asset rules before applying business effects

## Performance Strategy

### Database

- Optimize read-heavy paths with targeted indexes
- Keep common queries under sub-100ms when feasible

### Caching

- Use Redis for pricing, presale stats, and frequently requested aggregates

### Async Processing

- Use BullMQ, RabbitMQ, or equivalent queueing for non-blocking work
- Keep blockchain polling isolated from synchronous API latency

## Real-Time Updates

Support:

- WebSockets through NestJS gateways
- Polling fallback when sockets are unavailable

Typical events:

- Transaction updates
- Presale progress
- Tier changes

## Scalability Plan

### Phase 1

- Modular NestJS monolith
- Single PostgreSQL instance
- Optional Redis

### Phase 2

- Introduce a stronger queue system
- Split blockchain processing from the main request path

### Phase 3

- Break out dedicated services such as transaction, blockchain, and pricing services

## Refund Model

- Never reverse the original inbound transaction
- Create a new outbound transaction record
- Track fields such as `refund_tx_hash`, `refund_amount`, and `refund_status`
- Restrict refunds to admin-controlled paths

## DevOps and Monitoring

### Deployment

- Dockerized services
- Environment-based config
- CI and CD through GitHub Actions or equivalent

### Reliability

- Structured logging with Winston or Pino
- `/health` endpoint
- Metrics for success rate, confirmation latency, and API response times

## Success Metrics

- API latency under 200ms at P95
- Transaction processing reliability above 99.9%
- Zero duplicate or inconsistent transactions
- Accurate blockchain-to-database reconciliation

## Final Principles

- Never trust client input
- Always verify on-chain
- Design for failure and retries
- Enforce idempotency in all financial flows
- Scale only when the system needs it, but prepare the boundaries early
