# FlowDex Frontend Standards

This document is the canonical frontend standard for `fe/`.

It replaces the old generic layout guidance and matches the real FlowDex frontend:
- Next.js App Router in `src/app`
- shared product UI in `src/components/flowdex`
- shared primitives in `src/components/ui`
- concern-based DALs in `src/dal/market` and `src/dal/app`
- canonical frontend routes in `src/routes.ts`
- canonical API routes in `src/api-routes.ts`
- canonical app-level icons in `src/icons.ts`

## What Is Already Correct

These existing patterns are good and should be preserved:

1. Thin `page.tsx` wrappers are acceptable when they only handle route entry concerns.
2. Public and authenticated data access are correctly split between `src/dal/market` and `src/dal/app`.
3. `nuqs` is already installed and wired at the app root and is the required URL state solution for client-owned query state.
4. Backend DTOs already live mostly in DAL types and must remain the source of truth.

## Canonical Architecture

### 1. Route Ownership

`src/app/**` owns route-specific logic.

For larger routes, the route segment is the boundary. Use this structure:

```text
src/app/<segment>/
├── page.tsx
├── hooks/
├── utils/
├── constants.ts | constants/
├── types/            # only route-local UI types
└── _components/      # only route-local subcomponents
```

Use thin pages when the route only needs:
- params or search params parsing
- auth gating
- initial server fetches
- metadata wiring
- composition of existing route-owned modules

Move logic out of a thin page when the route grows stateful UI, route-local helpers, route-local constants, or multiple subcomponents.

### 2. Shared Code Boundaries

- `src/components/ui`: shared reusable UI primitives
- `src/components/flowdex`: shared product UI reused by more than one route segment
- `src/hooks`: cross-route hooks
- `src/utils`: cross-route utilities
- `src/constants`: cross-route constants
- `src/types`: cross-route UI types only
- `src/lib` and `src/libs`: framework/library integration helpers

Do not place route-local helpers in root shared folders.

## Routes

### Frontend Routes

All internal navigation must use `src/routes.ts`.

Use it for:
- `Link`
- `router.push`
- `router.replace`
- `redirect`
- `window.location.assign`
- route builders for nested pages
- auth redirect helpers

Rules:
- Never hardcode internal page paths in feature code.
- Add new internal paths to `src/routes.ts` first.
- Feature-level wrappers are allowed only if they call the root registry.

### Backend and BFF Routes

All backend and BFF endpoints must originate from `src/api-routes.ts`.

Rules:
- Add new endpoint paths to `src/api-routes.ts` first.
- Server fetch helpers and DAL services must consume the root API registry directly.
- Do not add DAL `routes.ts` files that simply alias, mirror, or re-export `src/api-routes.ts`.
- If a DAL service needs an endpoint, import `API_ROUTES` from the source instead of wrapping it in another const.

## DAL Standard

DAL is the source of truth for backend communication.

Do not use broad aggregate modules such as one giant `dal/app` or one giant `dal/market` surface.

Split DAL by concern:

```text
src/dal/app/
├── auth/
├── dashboard/
├── wallets/
├── transactions/
└── admin/

src/dal/market/
├── pricing/
└── presale/
```

Each concern should use:

```text
<feature>.services.ts
<feature>.types.ts
```

Rules:
- DTOs from the backend live in DAL types.
- React Query hooks live in the matching DAL service file. Do not create separate `*.hooks.ts` files for backend data.
- Components must import backend query and mutation hooks from the relevant `*.services.ts` file.
- UI variations must derive from DAL DTOs with `Pick`, `Omit`, intersections, or mapped types.
- Do not redefine backend payload types in route folders or root `src/types`.
- Keep public and authenticated domains separate.
- Do not recreate old aggregate entrypoints like `dal/app/types.ts` or `dal/market/services.ts`.
- If two concerns are meaningfully different, keep them in separate DAL folders even if they are both under `/app`.

### Backend Fetching

Use the repo-safe Axios stack for DAL fetching:
- authenticated app requests use `useAxiosAuth()` from `src/hooks/use-axiosAuth.tsx`
- app requests target `API_ROUTES.bff.*` so the existing Next.js BFF can mint the backend internal JWT
- public market requests use `api` or `axiosInstance` from `src/lib/axios.ts`
- endpoint strings and route builders live only in `src/api-routes.ts`
- mutation errors use `extractAxiosError()` from `src/lib/axios.ts`

Rules:
- Components must not call Axios or `fetch` directly for backend data.
- Reads must use `useQuery` or `useInfiniteQuery` inside the DAL service file.
- Writes must use `useMutation` inside the DAL service file.
- Query keys must be stable and include every input that changes the result.
- Optional IDs and optional auth-dependent inputs must be gated with `enabled`.
- Mutation success and failure toasts belong in React Query callbacks, not repeated in consuming components.
- Invalidate only affected resource families.
- Normalize endpoint-specific response shapes inside the DAL service before returning them to UI.
- Use `FormData` only for multipart/file payloads, and set multipart request headers there.
- Use `blob` or `arraybuffer` response types for downloads.

## URL State With `nuqs`

`nuqs` is mandatory for client-owned URL state.

Allowed:
- App Router `searchParams` in server page entrypoints
- metadata/server-only parsing flows
- route builders in `src/routes.ts`

Not allowed:
- mutable client state driven by `useSearchParams`
- ad hoc query string reads/writes in client components
- manual query-state navigation when a `nuqs` parser should exist

Rules:
- Define feature query parsers close to the route or feature that owns them.
- Prefer `useQueryState` or `useQueryStates`.
- Clear query-state through `nuqs`, not by manual string replacement.
- If a filter or tab is user-visible and shareable, it should usually live in the URL via `nuqs`.

## Types and Enums

### Ownership Rules

- Backend DTOs: DAL `*.types.ts`
- Cross-route UI types: `src/types`
- Route-local UI types shared across a route module: route-local `types/`
- Component-local prop types: inside the component file

### Backend DTO Naming

Backend-derived DAL data types must use the `I<TypeName>` convention.

Examples:
- `IAuthMe`
- `IWallet`
- `ITransactionListItem`
- `IPricingItem`
- `IPresaleConfig`

Apply the `I` prefix to:
- objects received from the backend
- response wrapper shapes returned by the backend
- nested backend-derived DTO containers

Do not apply the `I` prefix to:
- request payloads sent to the backend
- filter/query input types
- local UI-only types
- enums or enum-like constants

### Import Rules

- Import types directly from the defining file.
- Do not re-export types from convenience barrels.
- Do not create empty wrapper type files that only mirror another source.
- Backend DTOs must keep the `I<TypeName>` prefix at their DAL source of truth.

### Enum-Like Constants

Use enum-like constants for stable business-domain values. In this repo that includes:
- user roles
- wallet providers
- wallet networks
- wallet trust levels
- transaction statuses
- auth modes when shared across multiple files

String unions are still acceptable for:
- one-file UI-only variants
- local display modes
- values not shared across app boundaries or conditional logic

## Icons

All app-level icon imports must go through `src/icons.ts`.

Allowed direct `lucide-react` imports:
- shared UI infrastructure in `src/components/ui`
- icon infrastructure files themselves

Not allowed:
- direct `lucide-react` imports inside page code, product features, route modules, or layout features

## Wrapper Policy

Do not keep wrappers that only rename or pass through another component/provider.

Remove wrappers when they do nothing except:
- return `{children}`
- forward identical props without adding logic
- wrap a single provider with no FlowDex-specific behavior
- mirror an aggregate DAL module without owning real logic

Examples of wrappers that should be removed instead of preserved:
- pass-through provider aliases
- dead icon gateway duplicates
- aggregate DAL files that only proxy the real concern modules
- page-adjacent wrappers that can be moved into the route file directly

## Utilities and Constants

Rules:
- cross-route helpers go in `src/utils`
- route-local helpers go in route-local `utils/`
- cross-route constants go in `src/constants`
- route-local constants go in route-local `constants.ts` or `constants/`
- avoid generic catch-all files once a helper set grows beyond one small cohesive file

Prefer domain names like:
- `transaction-status.ts`
- `buy-form-query.ts`
- `wallet-network.ts`

Avoid broad names like:
- `helpers.ts`
- `misc.ts`
- `common.ts`

## Next.js Boundaries

Use server contexts for:
- auth gating
- protected server fetches
- initial route composition
- params and search params parsing

Use client contexts for:
- React Query hooks
- interactive UI state
- `nuqs` URL state
- browser APIs

Do not move server-only logic into client components just to simplify imports.

## Review Checklist

Every frontend PR should pass this checklist:

1. No raw internal route strings were introduced.
2. No new backend/BFF path literals were introduced outside `src/api-routes.ts`.
3. No DAL route alias files or API const mirrors were introduced.
4. No direct `lucide-react` imports were introduced in feature code.
5. No backend DTOs were duplicated outside DAL.
6. No type re-exports were introduced.
7. Route-local code stayed with its owning route segment.
8. Client-owned query state uses `nuqs`.
9. New conditionals use enum-like domain constants instead of raw strings when values are shared.
10. No new empty wrappers or pass-through provider aliases were introduced.

## Validation Commands

Run from `fe/`:

```bash
npm run check:types
npm run lint
npm run test
npm run build
```

For spot checks:

```bash
rg -n 'href="/|router\.push\('/ src
rg -n "redirect\('/|window\.location\.assign\('/" src
rg -n "from 'lucide-react'" src/components/flowdex src/components/layout src/components/kbar
rg -n "useSearchParams|URLSearchParams\(" src
```

## Adoption Policy

These standards are mandatory for new work.

Existing code does not need a repo-wide rewrite in one pass. When touching an existing feature:
- migrate its internal route literals to `src/routes.ts`
- migrate its endpoint literals to `src/api-routes.ts`
- migrate feature icon imports to `src/icons.ts`
- replace shared domain raw strings with enum-like constants
- move route-local helpers toward the route segment if the feature is growing

Incremental standardization is required. “We will fix it later” is not acceptable for code already being modified.
