# Full Worktree Release Repair Design

## Objective

Make the entire current FlowDex worktree release-ready while treating every existing file deletion and dependency removal as intentional. Repair forward without restoring removed components, utilities, tooling, or packages.

## Scope

The release includes the complete current backend and frontend worktree, including:

- the wallet-only Bitcoin and TRON checkout implementation;
- backend wallet-action preparation, checkout capability tokens, transaction-result submission, and the new database migration;
- the frontend dependency and tooling cleanup;
- all staged, unstaged, and currently untracked runtime files;
- the existing shared UI, DAL, authentication, routing, and marketing cleanup.

Documentation-only planning files are not production runtime dependencies. They may remain untracked and must not determine whether the application builds or deploys.

## Constraints

- Preserve all current deletions and dependency removals.
- Do not restore code from `HEAD` merely to make validation pass.
- Do not add compatibility wrappers or fallback payment paths.
- Do not reintroduce manual/direct-send Bitcoin or TRON checkout.
- Do not stage, commit, push, or deploy until the repaired worktree is verified and the user explicitly proceeds with release actions.
- Keep frontend route, DAL, URL-state, icon, and `/buy` execution changes aligned with the FlowDex frontend conventions.

## Repair Strategy

### Dependency graph

Use the smallest dependency graph that supports the code still present in `fe/src`.

1. Remove build-time workarounds that force unrelated nested dependency versions through the same transpilation path.
2. Keep direct wallet dependencies only when application code imports them directly.
3. Align direct Wagmi packages with the peer contract required by Account Kit.
4. Regenerate `fe/package-lock.json` using the npm version declared by the frontend package.
5. Use package overrides only if a required upstream package cannot otherwise resolve a compatible graph; overrides are not the default solution.

### Source repair

Fix forward from the reduced source tree:

- remove stale imports and references to deleted modules;
- add an icon export only when a still-live component imports that icon;
- keep route-specific checkout code under the `/buy` route;
- keep backend DTO and persistence contracts consistent with the frontend DAL types;
- include every new runtime file required by an import or Nest module registration;
- preserve wallet-provider approval and broadcasting for BTC, TRON, Solana, and EVM checkout paths.

### Backend and migration

The backend must build with the checkout capability service, wallet action executors, and migration present. The production start sequence must compile the migration and continue to support running migrations before application startup.

The TRON path must remain:

1. create a payment intent with an intent-scoped checkout token;
2. prepare a server-validated TRC-20 wallet action;
3. request TronLink approval and broadcast;
4. submit the TRON transaction hash;
5. track backend confirmation.

There must be no manual payment-address instruction branch.

## Validation Design

Validation proceeds from narrow diagnostics to release gates so failures remain attributable.

### Frontend gates

- clean npm install compatibility using the declared npm version;
- TypeScript check;
- ESLint with zero errors;
- Knip dependency/dead-code check, with every remaining finding classified and fixed when actionable;
- Next.js production build;
- focused checkout file validation;
- static build validation only if it is still a supported deployment artifact after the cleanup.

### Backend gates

- checkout-focused Jest suites;
- full Jest suite, with unrelated failures investigated rather than silently ignored;
- Nest production build;
- migration discovery from compiled output;
- lint/type validation provided by the backend scripts.

### Repository gates

- `git diff --check`;
- no unresolved merge entries;
- no imported runtime file left untracked by the intended release set;
- review staged, unstaged, and untracked changes as one release snapshot;
- verify that removed packages are not imported anywhere in live source.

## Release Readiness

The worktree is ready for deployment only when:

- frontend and backend production builds pass;
- frontend type checking and linting have no errors;
- checkout-focused backend tests pass;
- the full backend test result is reported accurately;
- the wallet-checkout migration is present and compiled;
- BTC/TRON checkout contains no manual/direct-send fallback;
- the complete release diff has no conflict markers or whitespace errors;
- any remaining warning is documented with evidence that it does not affect production correctness.

Staging, committing, pushing, and production deployment are separate release actions after these gates pass.
