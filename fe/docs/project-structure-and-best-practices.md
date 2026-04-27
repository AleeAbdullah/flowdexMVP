
## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   │   ├── (marketing)/   # Route groups
│   │   │   ├── _components/  # Page-specific components
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── api/           # API routes
│   └── ...
├── components/             # Reusable components
│   ├── ui/                # shadcn/ui components (Button, Input, etc.)
│   ├── icons/             # Icon components
│   ├── animations/        # Animation components
│   └── providers/         # Context providers
├── features/              # Feature-based modules
│   ├── product/
│   │   ├── components/    # Product-specific components
│   │   ├── hooks/        # Product-specific hooks
│   │   └── services/      # Product services
│   ├── cart/
│   ├── checkout/
│   └── ...
├── hooks/                 # Shared reusable hooks
├── lib/                   # Library configurations and utilities
│   ├── utils.ts           # Utility functions (cn, etc.)
│   ├── query-client.ts    # React Query configuration
│   └── ...
├── services/              # API service layer
│   ├── product/
│   │   ├── product.service.ts
│   │   ├── product.types.ts
│   │   └── product.hooks.ts
│   ├── order/
│   ├── user/
│   └── ...
├── stores/                # Zustand stores
├── types/                 # Global types and interfaces
│   ├── product.types.ts
│   ├── order.types.ts
│   ├── user.types.ts
│   ├── auth.types.ts
│   ├── cart.types.ts
│   └── checkout.types.ts
├── utils/                 # Utility functions
└── validations/           # Zod validation schemas
```

All types, interfaces, and enums should be defined in the `src/types/` folder, organized by domain:

```typescript
// src/types/product.types.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  brand: string;
  category: string;
}

export type ProductStatus = 'active' | 'inactive' | 'draft';

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
}
```

### Type Utilities

Use TypeScript utility types for code reuse:

```typescript
// Create variations using utility types
export type ProductPreview = Pick<Product, 'id' | 'name' | 'price' | 'images'>;
export type CreateProduct = Omit<Product, 'id' | 'createdAt'>;
export type UpdateProduct = Partial<Pick<Product, 'name' | 'price' | 'description'>>;
```

### Service-Specific Types

Services can have their own types file that imports from the main types or the other way around:

```typescript
// src/services/product/product.types.ts
import type { Product, ProductFilters } from '@/types/product.types';

export interface ProductServiceResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export type ProductServiceParams = ProductFilters & {
  page?: number;
  limit?: number;
};
```

## Service Layer Pattern

### Service Structure

Each service should have if needed:
1. **Service file** (`product.service.ts`) - API calls and business logic
2. **Types file** (`product.types.ts`) - Service-specific types
3. **Hooks file** (`product.hooks.ts`) - React Query hooks


### Component Location

1. **Page-specific components**: Place in `_components/` folder within the page directory
   ```
   app/[locale]/(marketing)/products/
   ├── _components/
   │   ├── product-list.tsx
   │   └── product-filters.tsx
   ├── layout.tsx
   └── page.tsx
   ```

2. **Feature-specific components**: Place in `features/[feature]/components/`
   ```
   features/product/
   ├── components/
   │   ├── product-card.tsx
   │   └── product-details.tsx
   ```

3. **Reusable UI components**: Place in `components/ui/` (shadcn/ui)
4. **Shared components**: Place in `components/`

## URL State Management with nuqs

Use nuqs for URL query parameters:

```typescript
'use client';

import { useQueryStates } from 'nuqs';
import { parseAsInteger, parseAsString, parseAsStringEnum } from 'nuqs';

const filters = {
  page: parseAsInteger.withDefault(1),
  category: parseAsString,
  sort: parseAsStringEnum(['price-asc', 'price-desc', 'name-asc']).withDefault('name-asc'),
};

export const ProductFilters = () => {
  const [params, setParams] = useQueryStates(filters);

  return (
    <div>
      <select value={params.sort} onChange={(e) => setParams({ sort: e.target.value })}>
        {/* Options */}
      </select>
    </div>
  );
};
```

### TypeScript Best Practices

1. **Always use types** - Avoid `any`, use `unknown` if needed
2. **Use utility types** - `Pick`, `Omit`, `Partial`, `Required`, etc.
3. **Single source of truth** - Define types once, reuse everywhere
4. **Type inference** - Let TypeScript infer types when possible
5. **Explicit return types** - For functions that return complex types

### Reusability

- **Extract reusable logic** into custom hooks
- **Create utility functions** for common operations
- **Share components** that are used in multiple places
- **Avoid duplication** - DRY (Don't Repeat Yourself) principle

### File Organization

- **One component per file** (except for related small components)
- **Co-locate related files** (component + test + story)
- **Group by feature** when possible
- **Keep imports organized** (external, internal, relative)

## Best Practices

### 1. Component Composition

Break complex components into smaller, composable pieces:

```typescript
// Instead of one large component
export const ProductPage = () => {
  // 400+ lines of code
};

// Break into smaller components
export const ProductPage = () => {
  return (
    <div>
      <ProductHeader />
      <ProductFilters />
      <ProductList />
      <ProductPagination />
    </div>
  );
};
```

### 2. Custom Hooks for Reusability

Extract reusable logic into custom hooks:

```typescript
// src/hooks/use-product-filters.ts
export const useProductFilters = () => {
  const [filters, setFilters] = useQueryStates(productFilters);
  const { data } = useProducts(filters);

  return {
    filters,
    setFilters,
    products: data?.products,
    isLoading: data?.isLoading,
  };
};
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
const { data, error, isLoading } = useProducts();

if (error) {
  return <ErrorBoundary error={error} />;
}
```

### 4. Loading States

Always show loading states:

```typescript
if (isLoading) {
  return <SkeletonLoader />;
}
```

### 5. Type Safety

Use TypeScript strictly:

```typescript
// ✅ Good - Type-safe
const product: Product = await getProduct(id);

// ❌ Bad - No type safety
const product = await getProduct(id);
```


---

**Remember**: Consistency is key. Follow these patterns throughout the project to maintain code quality and developer experience.

