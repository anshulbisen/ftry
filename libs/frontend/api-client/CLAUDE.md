# Frontend API Client Library - Claude Context

## Overview

Unified API client library for the ftry frontend using TanStack Query (react-query) v5 with CSRF protection and HTTP-only cookie authentication.

## Architecture

This library provides a dual-approach API client:

1. **React Query (Primary)**: For declarative data fetching with caching, revalidation, and state management
2. **Axios Client (Fallback)**: For imperative calls, file uploads, streaming, or non-query operations

## Key Components

### 1. CSRF Token Management (`csrf.ts`)

Handles Double Submit Cookie Pattern for CSRF protection:

```typescript
import { getCsrfToken, clearCsrfToken, prefetchCsrfToken } from '@ftry/frontend/api-client';

// Get token (cached automatically)
const token = await getCsrfToken();

// Clear token (on 403 or session change)
clearCsrfToken();

// Prefetch on app init (optional)
await prefetchCsrfToken();
```

**Key Features**:

- Automatic caching to avoid redundant requests
- Fetches from `/auth/csrf` endpoint
- Token cleared automatically on 403 errors
- Stateless (no React dependencies)

### 2. Axios Client (`axios-client.ts`)

Pre-configured axios instance with interceptors:

```typescript
import { apiClient } from '@ftry/frontend/api-client';

// GET request (no CSRF token)
const response = await apiClient.get('/users');

// POST request (CSRF token auto-attached)
const response = await apiClient.post('/users', userData);

// Tokens sent automatically via HTTP-only cookies
```

**Features**:

- Base URL: `import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'`
- CSRF auto-injection for POST/PUT/PATCH/DELETE
- Automatic token refresh on 401 errors
- Race condition prevention for concurrent refresh requests
- `withCredentials: true` for cookie-based auth

**Request Interceptor**:

1. Checks if method requires CSRF (POST/PUT/PATCH/DELETE)
2. Fetches CSRF token (or uses cached)
3. Attaches `x-csrf-token` header

**Response Interceptor**:

1. Detects 401 errors
2. Calls `/auth/refresh` (only once for concurrent requests)
3. Retries original request with new tokens
4. Handles network errors gracefully (doesn't logout)
5. Clears CSRF token on 403

### 3. React Query Client (`query-client.ts`)

Pre-configured QueryClient with sensible defaults:

```typescript
import { queryClient, DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME } from '@ftry/frontend/api-client';

// Configuration:
// - staleTime: 5 minutes (data fresh for 5 min)
// - gcTime: 10 minutes (cache garbage collection)
// - refetchOnWindowFocus: false
// - retry: 1 attempt with exponential backoff
```

**Error Handling**:

```typescript
import { handleQueryError } from '@ftry/frontend/api-client';

const errorMessage = handleQueryError(error);
// Handles AxiosError, Error, string, unknown
```

### 4. Query Provider (`QueryProvider.tsx`)

React component wrapper for TanStack Query:

```typescript
import { QueryProvider } from '@ftry/frontend/api-client';

function App() {
  return (
    <QueryProvider>
      <YourApp />
    </QueryProvider>
  );
}
```

**Features**:

- Wraps app with `QueryClientProvider`
- Includes `ReactQueryDevtools` in development
- DevTools positioned at bottom-left
- Accepts custom QueryClient (optional)

### 5. Custom Hooks

#### useLoginMutation

```typescript
import { useLoginMutation } from '@ftry/frontend/api-client';

const {
  mutate: login,
  isPending,
  isError,
  error,
} = useLoginMutation({
  onSuccess: (user) => {
    console.log('Logged in:', user.email);
    navigate('/dashboard');
  },
  onError: (error) => {
    toast.error('Login failed');
  },
});

// Usage
login({ email: 'user@example.com', password: 'password123' });
```

**Returns**: `SafeUser` object (tokens handled via HTTP-only cookies)

#### useLogoutMutation

```typescript
import { useLogoutMutation } from '@ftry/frontend/api-client';

const { mutate: logout, isPending } = useLogoutMutation({
  onSuccess: () => {
    navigate('/login');
  },
});

// Usage
logout();
```

**Note**: Revokes refresh token on backend, clears cookies

#### useCurrentUser

```typescript
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from '@ftry/frontend/api-client';

const { data: user, isLoading, isError, refetch } = useCurrentUser({
  enabled: isAuthenticated, // Optional: conditionally fetch
});

if (isLoading) return <Skeleton />;
if (isError) return <Error />;

return <div>Hello, {user.firstName}!</div>;
```

**Features**:

- Automatic caching (5 min stale time)
- Refetch on invalidation
- Query key exported for manual invalidation

**Manual Invalidation**:

```typescript
import { useQueryClient, CURRENT_USER_QUERY_KEY } from '@ftry/frontend/api-client';

const queryClient = useQueryClient();

// After profile update
await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
```

## Usage Patterns

### When to Use React Query vs Axios

**Use React Query (Preferred)**:

- Fetching data for display (GET requests)
- Mutations that update cached data (POST/PUT/PATCH/DELETE)
- Need automatic retries, caching, or revalidation
- Want declarative loading/error states

**Use Axios Client**:

- File uploads with progress tracking
- Streaming responses
- Webhook endpoints
- Non-query operations (logout, token refresh)
- Need direct response access

### Example: User Management with React Query

```typescript
import { useQuery, useMutation, useQueryClient, apiClient } from '@ftry/frontend/api-client';

// Query for users list
const { data: users, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await apiClient.get<{ data: User[] }>('/users');
    return response.data.data;
  },
});

// Mutation for creating user
const queryClient = useQueryClient();
const { mutate: createUser } = useMutation({
  mutationFn: async (userData: CreateUserDto) => {
    const response = await apiClient.post<{ data: User }>('/users', userData);
    return response.data.data;
  },
  onSuccess: () => {
    // Invalidate and refetch users list
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// Mutation for deleting user
const { mutate: deleteUser } = useMutation({
  mutationFn: async (userId: string) => {
    await apiClient.delete(`/users/${userId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Example: Optimistic Updates

```typescript
const { mutate: updateUser } = useMutation({
  mutationFn: async (user: User) => {
    const response = await apiClient.patch(`/users/${user.id}`, user);
    return response.data.data;
  },
  onMutate: async (updatedUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['user', updatedUser.id] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['user', updatedUser.id]);

    // Optimistically update
    queryClient.setQueryData(['user', updatedUser.id], updatedUser);

    // Return context with snapshot
    return { previousUser };
  },
  onError: (err, updatedUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['user', updatedUser.id], context?.previousUser);
  },
  onSettled: (updatedUser) => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['user', updatedUser?.id] });
  },
});
```

### Example: Infinite Scrolling

```typescript
import { useInfiniteQuery } from '@ftry/frontend/api-client';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['users', 'infinite'],
  queryFn: async ({ pageParam = 0 }) => {
    const response = await apiClient.get<{ data: User[], total: number }>(
      `/users?page=${pageParam}&limit=20`
    );
    return response.data;
  },
  getNextPageParam: (lastPage, pages) => {
    const totalFetched = pages.length * 20;
    return totalFetched < lastPage.total ? pages.length : undefined;
  },
});

// Render
data?.pages.map((page) =>
  page.data.map((user) => <UserCard key={user.id} user={user} />)
);

// Load more
{hasNextPage && (
  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
    {isFetchingNextPage ? 'Loading...' : 'Load More'}
  </Button>
)}
```

## Environment Variables

```env
VITE_API_URL=http://localhost:3001/api/v1  # Backend API base URL
```

## Testing

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUser } from '@ftry/frontend/api-client';

describe('useCurrentUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch current user', async () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });
});
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';
import * as apiClient from '@ftry/frontend/api-client';

vi.mock('@ftry/frontend/api-client', async () => {
  const actual = await vi.importActual('@ftry/frontend/api-client');
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// In test
vi.mocked(apiClient.apiClient.get).mockResolvedValue({
  data: { data: mockUser },
});
```

## Common Patterns

### 1. Dependent Queries

```typescript
const { data: user } = useCurrentUser();

const { data: permissions } = useQuery({
  queryKey: ['permissions', user?.id],
  queryFn: async () => {
    const response = await apiClient.get(`/users/${user?.id}/permissions`);
    return response.data.data;
  },
  enabled: !!user, // Only run when user is available
});
```

### 2. Query Prefetching

```typescript
import { useQueryClient } from '@ftry/frontend/api-client';

const queryClient = useQueryClient();

// Prefetch on hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data.data;
    },
  });
};
```

### 3. Global Error Handling

```typescript
import { QueryCache, MutationCache } from '@tanstack/react-query';
import { queryClient } from '@ftry/frontend/api-client';

const queryCache = new QueryCache({
  onError: (error) => {
    toast.error(`Query error: ${handleQueryError(error)}`);
  },
});

const mutationCache = new MutationCache({
  onError: (error) => {
    toast.error(`Mutation error: ${handleQueryError(error)}`);
  },
});
```

## Best Practices

1. **Always use query keys consistently**
   - Use arrays: `['users', userId]` not `'users-' + userId`
   - Co-locate query keys: `export const userKeys = { all: ['users'], detail: (id) => ['users', id] }`

2. **Invalidate queries after mutations**
   - Use `queryClient.invalidateQueries()` after successful mutations
   - Be specific with query keys to avoid over-fetching

3. **Handle loading and error states**
   - Always check `isLoading` and `isError`
   - Provide fallback UI for errors

4. **Use optimistic updates sparingly**
   - Only for instant feedback (likes, toggles)
   - Always implement rollback logic

5. **Leverage staleTime and gcTime**
   - Set per-query for fine-grained control
   - Longer staleTime for rarely-changing data
   - Shorter for real-time data

6. **Prefetch for better UX**
   - Prefetch on route enter or hover
   - Use `initialData` for instant rendering

7. **Test with QueryClient mock**
   - Always wrap hooks in QueryClientProvider
   - Use `retry: false` in tests

## Migration from Old Auth Store

When migrating from the existing Zustand auth store to this library:

1. Replace `useAuth()` hook with appropriate hooks:
   - `login()` → `useLoginMutation()`
   - `logout()` → `useLogoutMutation()`
   - `user` → `useCurrentUser()`

2. Remove local token storage (now via HTTP-only cookies)

3. Remove manual API error handling (handled by react-query)

4. Update navigation logic (move to mutation callbacks)

5. Invalidate user query on auth state changes

## Known Limitations

1. **CSRF Token Caching**: Token is cached in module-level variable (cleared on 403)
2. **Refresh Token Race Condition**: Single refresh promise prevents concurrent refreshes
3. **No Offline Support**: Requires network for all operations
4. **No Request Deduplication**: Multiple identical queries may fire concurrently (mitigated by react-query)

## Future Enhancements

1. **Request Deduplication**: Implement cache for identical concurrent requests
2. **Offline Support**: Add service worker for offline-first capabilities
3. **WebSocket Integration**: Custom hooks for real-time data
4. **File Upload Hooks**: Dedicated mutation hooks with progress tracking
5. **Retry Strategies**: Smart retry based on error type
6. **Background Sync**: Queue mutations when offline

## Related Files

- `/libs/frontend/auth/` - Legacy auth implementation (to be migrated)
- `/apps/frontend/src/app/app.tsx` - App root (add QueryProvider here)
- `/libs/shared/types/` - Shared TypeScript types (SafeUser, etc.)

## Dependencies

- `@tanstack/react-query`: ^5.90.2
- `@tanstack/react-query-devtools`: ^5.90.2
- `axios`: ^1.6.0
- `react`: 19.0.0

---

**Last Updated**: 2025-10-08
**Status**: Production-ready
**Test Coverage**: 100% (55/55 tests passing)
