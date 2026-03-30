# FlowDex Data Access Layer System

## Table of Contents

1. Scope
2. DAL Structure
3. File Naming
4. API Routes
5. Types
6. Services
7. React Query Patterns
8. Implementation Guidelines

## Scope

Apply these rules whenever work touches `dal/**/*`, `data-access-layer`, or any frontend API service layer. Treat this file as a hard constraint for FE data-access work.

## DAL Structure

Organize DAL code by feature or service domain.

Example:

```text
dal/
├── api-routes.ts
├── auth/
│   ├── auth.services.ts
│   └── auth.types.ts
├── contacts/
│   ├── contacts.services.ts
│   ├── contacts.types.ts
│   └── contacts.constants.ts
└── quotes/
    ├── quotes.services.ts
    └── quotes.types.ts
```

Each feature directory should contain at minimum:

- `[module].services.ts`
- `[module].types.ts`

## File Naming

- Services: `[module].services.ts`
- Types: `[module].types.ts`
- Central routes: `dal/api-routes.ts`
- Use kebab-case for directories
- Use lowercase dotted filenames

## API Routes

- Centralize all endpoints in `dal/api-routes.ts`
- Use `API_ROUTES` with ALL_CAPS route constants
- Group routes by feature
- Use nested structure for clarity
- Use functions for parameterized routes

Example:

```ts
export const API_ROUTES = {
  CONTACTS: {
    BASE: "/api/contacts/",
    BY_ID: (id: number) => `/api/contacts/${id}/`,
  },
};
```

## Types

- Keep API request and response types in feature-specific `.types.ts` files
- Separate request and response types explicitly
- Keep shared DAL-specific types near the feature that owns them
- Use clear names such as `CreateContactRequest` and `ContactResponse`

## Services

- Use the configured Axios client for all API requests
- Use async and await
- Always declare return types
- Keep service logic focused on transport and query integration
- Do not bury complex business logic in the DAL

## React Query Patterns

### Query Hooks

- Use `useEntityName` naming such as `useContacts`
- Export hooks from the module service file

Example:

```ts
export const useContacts = (params: IContactsParams) => {
  const axiosAuth = useAxiosAuth();

  return useQuery({
    queryKey: ["contacts", params],
    queryFn: async (): Promise<IContactsResponse> => {
      const response = await axiosAuth.get(API_ROUTES.CONTACTS.BASE, { params });
      return response.data;
    },
  });
};
```

### Mutation Hooks

- Use `useActionEntity` naming such as `useCreateContact`
- Invalidate relevant queries on success

Example:

```ts
export const useCreateContact = () => {
  const axiosAuth = useAxiosAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ICreateContactRequest): Promise<IContactResponse> => {
      const response = await axiosAuth.post(API_ROUTES.CONTACTS.BASE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};
```

## Implementation Guidelines

- Keep each service file focused on one feature domain
- Follow the same patterns for similar operations across modules
- Keep all API calls fully typed
- Design services and hooks for reuse
- Keep functions focused and maintainable
- Follow TanStack React Query best practices for cache behavior and invalidation
