# FlowDex Frontend Coding Standards

## Table of Contents

1. Priority
2. Stack Assumptions
3. Code Style
4. App Router And Rendering
5. UI And Styling
6. State And Data Fetching
7. Validation And Error Handling
8. Security And Performance
9. Implementation Method

## Priority

Treat this file as higher priority than the design-only guidance when implementing FE code. Apply architecture, maintainability, and type safety rules first, then shape the result to the FlowDex brand system.

## Stack Assumptions

Use these versions as the default working assumption when no local `package.json` is available:

- Next.js `14.2.3`
- TypeScript `5.2.2`
- Tailwind CSS `3.4.0`
- Radix UI with shadcn/ui
- NextAuth.js `5.0.0-beta.18`
- Zustand `4.4.6`
- React Hook Form with Zod
- Axios `1.7.9`
- Centrifuge `5.3.5`
- Framer Motion `12.6.3`
- React Google Maps API
- Recharts `2.12.7`
- Sonner
- `nuqs` for search-parameter state

When a real project `package.json` exists, inspect it first and follow the actual installed versions.

## Code Style

- Write concise TypeScript with explicit types where they improve clarity.
- Prefer functional and declarative patterns.
- Avoid classes unless an external library forces them.
- Favor iteration and modularization over duplication.
- Use descriptive variable names with auxiliary verbs such as `isLoading`, `hasError`, and `shouldRender`.
- Use lowercase with dashes for directory names.
- Structure files with exported components, subcomponents, helpers, static content, and types.

## App Router And Rendering

- Prefer React Server Components by default.
- Minimize `use client`.
- Minimize `useEffect` and imperative synchronization.
- Favor SSR and server data loading where appropriate.
- Use dynamic imports for heavy or optional client-side surfaces.
- Keep mobile-first responsive behavior.
- Optimize images with modern formats, explicit sizing, and lazy loading.

## UI And Styling

- Use Tailwind CSS plus Radix UI and shadcn/ui patterns.
- Keep design consistent across the app.
- Import icons through the shared `icons.tsx` entrypoint.
- If an icon does not exist there, add it to `icons.tsx` before using it elsewhere.

## State And Data Fetching

- Use Zustand for global client state when server state is not the right tool.
- Use TanStack React Query for remote data fetching and mutations.
- Use Zod for schema validation.
- Use React Hook Form for forms.
- Use `nuqs` for URL search parameter state.
- Keep data access logic out of presentational components when the DAL can own it.

## Validation And Error Handling

- Prefer early returns and guard clauses.
- Handle invalid states close to their source.
- Use consistent custom error types or error-shaping helpers when the app needs shared handling.
- Validate user input and API payloads explicitly.

## Security And Performance

- Favor secure defaults and validated inputs.
- Keep render work minimal.
- Split code when it reduces initial bundle cost.
- Avoid unnecessary client state and effect churn.
- Keep code maintainable enough that optimization does not destroy clarity.

## Implementation Method

1. Analyze the request and constraints.
2. Plan the implementation structure before editing.
3. Implement in small, coherent steps.
4. Review for correctness, performance, and maintainability.
5. Align the final UI with the FlowDex brand system.
