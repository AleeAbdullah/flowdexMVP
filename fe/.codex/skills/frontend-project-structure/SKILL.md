---
name: frontend-project-structure
description: Frontend-only project structure and code organization guidance for this Next.js app. Use when working in the `fe/` workspace on file placement, type organization, service layering, component colocation, nuqs URL state, and TypeScript conventions.
---

# Frontend Project Structure

Use this skill only for the frontend workspace in `fe/`.

## Primary rules

- Keep app code under `src/`.
- Put route-level UI in `src/app/`.
- Keep shared UI in `src/components/`.
- Keep feature-specific modules in `src/features/`.
- Keep shared hooks, utilities, and library setup in `src/hooks/`, `src/utils/`, and `src/lib/`.
- Keep API/service code in `src/services/`.
- Keep domain types, interfaces, and enums in `src/types/`.
- Keep validation schemas in `src/validations/`.
- Keep state stores in `src/stores/`.

## Project layout

Follow this shape when adding or moving code:

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── (marketing)/
│   │   │   ├── _components/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── api/
│   └── ...
├── components/
│   ├── ui/
│   ├── icons/
│   ├── animations/
│   └── providers/
├── features/
├── hooks/
├── lib/
├── services/
├── stores/
├── types/
├── utils/
└── validations/
```

## Types

- Define all domain types in `src/types/<domain>.types.ts`.
- Reuse domain types across the app instead of redefining them.
- Use utility types such as `Pick`, `Omit`, `Partial`, and `Required` for variants.
- Put service-specific types next to the service in `src/services/<domain>/`.
- Import shared domain types into service types, not the reverse, unless the domain model genuinely belongs to the service boundary.

## Services

When a service needs more than one file, use this pattern:

- `*.service.ts` for API calls and business logic
- `*.types.ts` for service-specific types
- `*.hooks.ts` for React Query hooks

Keep services thin. Shared domain types stay in `src/types/`.

## Components

- Page-specific components belong in `_components/` beside the route.
- Feature-specific components belong in `src/features/<feature>/components/`.
- Reusable design-system components belong in `src/components/ui/`.
- Shared non-UI components belong in `src/components/`.
- Prefer one component per file.
- Co-locate related files when it helps readability.

## URL state with nuqs

Use `nuqs` for query-string state instead of manual parsing when state belongs in the URL.

```ts
'use client';

import { useQueryStates, parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs';

const filters = {
  page: parseAsInteger.withDefault(1),
  category: parseAsString,
  sort: parseAsStringEnum(['price-asc', 'price-desc', 'name-asc']).withDefault('name-asc'),
};

export const ProductFilters = () => {
  const [params, setParams] = useQueryStates(filters);

  return (
    <select value={params.sort} onChange={(event) => setParams({ sort: event.target.value })}>
      <option value="name-asc">Name</option>
    </select>
  );
};
```

## TypeScript standards

- Avoid `any`; use `unknown` if the shape is not known yet.
- Keep types single-sourced.
- Let inference work when the shape is obvious.
- Add explicit return types for complex functions.
- Prefer small reusable hooks and helpers over duplicate logic.

## Placement decision

When choosing a home for new code, use this order:

1. Route-specific `_components/`
2. `src/features/<feature>/`
3. `src/components/ui/`
4. `src/components/`
5. `src/services/`
6. `src/types/`
7. `src/hooks/`
8. `src/utils/`
9. `src/validations/`

