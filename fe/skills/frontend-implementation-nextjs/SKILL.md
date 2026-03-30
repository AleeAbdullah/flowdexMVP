---
name: frontend-implementation-nextjs
description: Frontend implementation guidance for Next.js work in this repository's FE directory. Use when Codex is designing, building, refactoring, or reviewing frontend code, especially app-router pages, components, forms, state, DAL modules, service hooks, validation, SSR and client boundaries, responsive behavior, and accessibility.
---

# Frontend Implementation NextJS

## Purpose

Use this skill as the default frontend implementation contract for the FE directory. Keep the work grounded in Next.js architecture, DAL boundaries, React Query patterns, validation, component composition, SSR and client boundaries, responsive review, and accessibility checks. Load brand or marketing references only when the task explicitly asks for product-specific UI work.

## Architecture Posture

- Treat the FE stack as TypeScript, React, Next.js App Router, Tailwind CSS, shadcn/ui, Radix UI, Zustand, React Hook Form, Zod, Axios, TanStack React Query, Framer Motion, Sonner, and related tooling described in `references/coding-standards.md`.
- Favor functional and declarative patterns. Avoid classes.
- Minimize `use client`, `useEffect`, and ad hoc local state when server components, SSR, or better composition can solve the problem.
- Prefer small, focused modules with descriptive names and explicit types.
- Use official documentation or project version files when available before making library-specific assumptions.
- Keep data-access concerns behind the DAL instead of scattering fetch logic through UI components.
- Treat responsive behavior and accessibility as first-class quality checks, not polish passes.

## Decision Flow

### 1. Place the change in the right rendering boundary

- Decide whether the work belongs in server components, client components, shared utilities, or the DAL before writing UI.
- Default to server-first composition and add `use client` only when browser APIs, interactivity, or client state truly require it.

### 2. Define the data and validation contract

- Reuse or add DAL modules, centralized route constants, and React Query hooks instead of calling Axios directly inside components.
- Keep request and response types explicit.
- Validate form and mutation boundaries with Zod and React Hook Form patterns from the repo references.

### 3. Compose the UI from clear building blocks

- Prefer small, focused components with explicit props and predictable ownership.
- Keep loading, error, empty, and success states designed alongside the happy path.
- Preserve separation between layout, presentation, and data orchestration.

### 4. Review behavior across environments

- Check SSR and client behavior together so hydration boundaries stay intentional.
- Check responsive behavior at mobile, tablet, and desktop widths, especially around `768px` and `1024px`.
- Check semantics, keyboard access, focus behavior, and visible validation or error feedback before closing the task.

### 5. Apply product references only when requested

- Use brand, marketing, or product-language references only when the user explicitly asks for branded work or points to those docs.
- Prefer correctness, maintainability, and type safety over cosmetic fidelity when a tradeoff appears.

## Non-Negotiable Engineering Rules

- Minimize `use client`, `useEffect`, and ad hoc local state when composition or server rendering can solve the problem more cleanly.
- Do not put direct API calls inside components when the DAL or a shared hook should own that interaction.
- Keep route constants, request typing, and service contracts centralized and explicit.
- Keep feature domains isolated so components and DAL modules stay composable.
- Ship accessible semantics, focus states, and actionable error handling as part of implementation, not as follow-up work.
- Keep SSR and client boundaries deliberate so the UI remains predictable and performant.

## Delivery Checklist

- Confirm where the change belongs: server, client, shared helper, or DAL.
- Confirm whether an existing DAL module, hook, or component can be reused before adding a new one.
- Confirm request, response, validation, loading, and error states are fully typed and handled.
- Confirm component composition and prop boundaries remain clear.
- Confirm responsive behavior at mobile, tablet, and desktop widths.
- Confirm keyboard, focus, semantics, and accessibility basics are covered.
- Confirm any brand-specific choices were loaded from references because the task explicitly called for them.

## Reference-Loading Instructions

- Read `references/coding-standards.md` when you need stack rules, naming, state, validation, performance, or implementation methodology.
- Read `references/dal-system.md` when touching anything under `dal/` or any data-access-layer surface.
- Read `references/brand-system.md`, `references/page-blueprints.md`, and `assets/flowdex-theme.css` only when the user explicitly asks for FlowDex-branded UI, marketing pages, product terminology, or points to those references directly.
- Keep `SKILL.md` as the default frontend operating playbook and treat product references as opt-in context.
