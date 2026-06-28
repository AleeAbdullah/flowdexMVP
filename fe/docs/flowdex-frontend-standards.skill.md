---
name: flowdex-frontend-standards
description: Enforce FlowDex frontend standards for Next.js App Router structure, routes, DAL ownership, URL state, types, and icon imports.
---

# FlowDex Frontend Standards Skill

Use this skill when modifying the FlowDex frontend in `fe/`.

## Mandatory Rules

1. Treat `fe/docs/project-structure-and-best-practices.md` as the canonical standard.
2. Use `src/routes.ts` for all internal page routes, redirects, and route builders.
3. Use `src/api-routes.ts` for all backend and BFF endpoint definitions.
4. Use `src/icons.ts` for app-level icon imports. Only shared UI/icon infrastructure may import `lucide-react` directly.
5. Use `nuqs` for client-owned URL state. Do not introduce mutable query-state flows with `useSearchParams`.
6. Keep backend DTOs in DAL `*.types.ts` and name them with the `I<TypeName>` convention. Derive UI variants from DAL types instead of redefining payload shapes.
7. Do not re-export types from convenience files.
8. Use enum-like constants for shared business-domain values such as roles, wallet providers, wallet networks, transaction statuses, and auth modes.
9. Split DAL by concern, not by one broad app-level or market-level aggregate.
10. Do not introduce raw internal route strings or raw backend endpoint literals in feature code.
11. Remove empty wrappers instead of preserving pass-through layers.
12. Do not create DAL `routes.ts` files or alias consts that merely mirror `src/api-routes.ts`.

## Route Module Contract

For substantial route segments, prefer:

```text
src/app/<segment>/
├── page.tsx
├── hooks/
├── utils/
├── constants.ts | constants/
├── types/
└── _components/
```

Use thin pages only for route entry concerns:
- params
- search params
- auth gating
- initial server fetches
- metadata wiring

## DAL Contract

Each DAL concern should use:

```text
<feature>.services.ts
<feature>.types.ts
```

DAL remains the source of truth for backend data contracts.
React Query hooks for backend data live in the same `*.services.ts` file. Do not create `*.hooks.ts` files in DAL.

Backend-derived DTO names must use `I<TypeName>`.
Examples: `IAuthMe`, `IWallet`, `ITransactionListItem`, `IPricingItem`.

Do not use the `I` prefix for request payloads, filters, or local UI-only types.

Preferred DAL layout:

```text
src/dal/app/auth
src/dal/app/dashboard
src/dal/app/wallets
src/dal/app/transactions
src/dal/app/admin
src/dal/market/pricing
src/dal/market/presale
```

Do not recreate aggregate files like `src/dal/app/types.ts` or `src/dal/market/services.ts`.
Do not create DAL route wrappers that simply re-export or rename `API_ROUTES`.

## Fetching Contract

- Authenticated app requests use `useAxiosAuth()` from `src/hooks/use-axiosAuth.tsx`.
- Authenticated app requests target `API_ROUTES.bff.*`; the BFF keeps backend JWT minting server-side.
- Public market requests use `api` or `axiosInstance` from `src/lib/axios.ts`.
- Components do not call Axios or `fetch` directly for backend data.
- Reads use `useQuery` or `useInfiniteQuery` in `*.services.ts`.
- Writes use `useMutation` in `*.services.ts`.
- Mutation callbacks own cache invalidation and user-triggered success/error toasts.
- Mutation errors use `extractAxiosError()`.

## Review Gate

Before finishing a frontend change, confirm:
- no raw route literals
- no raw endpoint literals outside `src/api-routes.ts`
- no DAL route alias wrappers around `src/api-routes.ts`
- no DAL `*.hooks.ts` files
- no direct `lucide-react` imports in feature code
- no duplicated backend DTOs
- backend DTOs use the `I<TypeName>` convention
- no type re-exports
- `nuqs` is used for client query state
- no empty wrappers were introduced
- no backend Axios or fetch calls from components

## Validation

Run from `fe/` when relevant:

```bash
npm run check:types
npm run lint
npm run build
```
