---
name: backend-architect-nestjs-postgres
description: Backend architecture guidance for NestJS and PostgreSQL work in this repository's BE directory. Use when Codex is designing, implementing, refactoring, or reviewing backend systems, especially API contracts, module boundaries, schema design, transactional workflows, background jobs, queues, integrations, and event-driven flows.
---

# Backend Architect NestJS Postgres

## Purpose

Use this skill as the default backend architecture contract for NestJS and PostgreSQL work in the BE directory. Keep decisions grounded in modular NestJS boundaries, PostgreSQL integrity, transactional state transitions, idempotent async processing, queue-safe jobs, API-first planning, and schema-first planning.

## Architecture Posture

- Default to a modular NestJS monolith that can be split later.
- Keep external communication REST-first unless the task explicitly calls for GraphQL or gRPC.
- Define API contracts and persistence boundaries before filling in controllers or handlers.
- Model database constraints and transaction boundaries before optimizing happy-path services.
- Prefer internal event-driven coordination for long-running, integration-heavy, or retry-prone flows.
- Treat workers, schedulers, and queue consumers as stateless processors.
- Keep shared mutable state in PostgreSQL or Redis, not in process memory.
- Scope recommendations to backend work only. Do not let frontend concerns reshape financial or data-integrity decisions.

## Decision Flow

### 1. Define the domain boundary first

- Identify the core entities, invariants, ownership boundaries, and lifecycle states.
- Decide which data is authoritative from external systems and which belongs to internal workflow state.
- Reject designs that trust client-submitted critical state without server-side verification.

### 2. Plan module and contract ownership

- Define which module owns persistence, state transitions, validation, and side effects.
- Keep controllers thin and let services coordinate policy within clear domain boundaries.
- Prefer module APIs and events over cross-module table reach-through.

### 3. Encode integrity in PostgreSQL

- Use precise column types such as `NUMERIC` where the domain cannot tolerate floating-point drift.
- Add unique constraints and foreign keys for duplicate prevention and relational integrity.
- Prefer database constraints plus transactional service logic over best-effort application checks.
- Index read-heavy lookup paths and selectors used by jobs, dashboards, and reconciliation flows.
- Make state transitions explicit so invalid jumps fail fast.

### 4. Design async processing for retries

- Assume external I/O, scheduled jobs, and queue workers will fail intermittently.
- Make consumers safe to rerun without duplicating business effects.
- Emit internal events for downstream updates instead of coupling long-running work to request latency.

### 5. Finish with operations and failure modes

- Add health checks, structured logging, and metrics before calling the design production-ready.
- Define how operators resolve stuck workflows, duplicate messages, and failed integrations.
- Plan for horizontal scaling by keeping processors stateless and coordination centralized.

## Non-Negotiable Engineering Rules

- Never trust client input for authoritative status, ownership, or other critical state.
- Always encode important invariants in the database and back them with transactional service logic.
- Keep state transitions explicit, guarded, and owned by the module responsible for persistence.
- Design every async processor and integration flow to be idempotent and retry-safe.
- Prefer schema-first planning over controller-first implementation.
- Prefer API-first planning over ad hoc endpoint growth.
- Keep background work queue-safe: no hidden in-memory locks, no duplicate side effects, no reliance on single-process execution.

## Delivery Checklist

- Define the module that owns each lifecycle transition and persistence write.
- Define the API contract or event contract before wiring handlers.
- Define the database constraints, indexes, and transaction boundaries that protect integrity.
- Define the retry and deduplication behavior for every background processor.
- Define the emitted events and downstream consumers.
- Define the operational path for failures, overrides, or reprocessing.
- Define the metrics, logs, and health checks needed to debug production issues.

## Reference-Loading Instructions

- Read `references/crypto-presale-backend-blueprint.md` only when the user explicitly asks for crypto presale work, wallet verification, on-chain reconciliation, chain listeners, token allocation, pricing ingestion, or other blockchain-specific flows.
- Keep `SKILL.md` as the default operating playbook and load product references only when the task names that product context or points to the reference directly.
