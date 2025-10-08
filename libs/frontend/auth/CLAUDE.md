# Frontend Auth Module - Claude Context

## Overview

React authentication module with Zustand state management, axios interceptors for token handling, and comprehensive auth hooks for the Ftry salon SaaS platform.

## Architecture

### Module Structure

```
libs/frontend/auth/
├── lib/
│   ├── auth.store.ts          # Zustand auth state management
│   ├── auth.api.ts            # Auth API endpoints
│   ├── api-client.ts          # Axios with interceptors
│   ├── api/
│   │   ├── auth-api.ts        # Auth-specific API calls
│   │   └── user-management.api.ts # User CRUD operations
│   └── components/
│       ├── AuthFormWrapper.tsx # Reusable auth form wrapper
│       └── FormField.tsx      # Form field component
```

## State Management (Zustand)

### Auth Store

```typescript
interface AuthState {
  user: SafeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth(user, accessToken, refreshToken);
  logout();
  updateTokens(accessToken, refreshToken?);

  // Permissions
  hasPermission(permission: string);
  hasAnyPermission(permissions: string[]);
  hasAllPermissions(permissions: string[]);

  // Role checks
  isSuperAdmin();
  isTenantOwner();
  isTenantAdmin();
}
```

### Security Concern

⚠️ **localStorage Persistence**: Tokens stored in localStorage via Zustand persist middleware

- Risk: XSS vulnerability - tokens accessible to malicious scripts
- Recommendation: Use memory-only storage or httpOnly cookies

## API Client Configuration

### Axios Interceptors

#### Request Interceptor

- Automatically attaches Bearer token to requests
- Retrieves token from Zustand store

#### Response Interceptor

- Handles 401 errors with automatic token refresh
- Implements race condition prevention for concurrent refreshes
- Maintains single refresh promise for all requests

### Token Refresh Flow

1. Detect 401 response
2. Check if refresh already in progress
3. If not, initiate refresh request
4. Wait for refresh completion
5. Retry original request with new token
6. On refresh failure, logout user

## Authentication Hooks

### useAuth()

Primary authentication hook providing:

- `login(email, password)`: User login
- `logout()`: Revoke tokens and clear state
- `register(...)`: New user registration
- `user`: Current user object
- `token`: Current access token
- `isAuthenticated`: Auth status

**Important**: Hook does NOT handle navigation - caller's responsibility

## API Endpoints

### Auth API (`auth.api.ts`)

- `login(email, password)`: POST /auth/login
- `register(dto)`: POST /auth/register
- `logout(refreshToken)`: POST /auth/logout
- `refreshToken(token)`: POST /auth/refresh
- `getCurrentUser()`: GET /auth/me

## Security Improvements Needed

### 1. Token Storage

```typescript
// Current: localStorage (vulnerable)
persist((state) => ({...}), {
  name: 'auth-storage'
})

// Recommended: Memory only
create<AuthState>((set) => ({
  // No persistence
}))
```

### 2. Request Deduplication

```typescript
// Add caching for concurrent requests
const requestCache = new Map<string, Promise<any>>();
```

### 3. Error Handling

```typescript
// Centralize error handling
export function handleAuthError(error: unknown): string {
  // Consistent error messages
}
```

## Common Patterns

### Protected Routes

```typescript
<ProtectedRoute requiredPermissions={['users.read']}>
  <UsersPage />
</ProtectedRoute>
```

### Permission Checks

```typescript
const { hasPermission, isSuperAdmin } = useAuthStore();

if (hasPermission('users.create') || isSuperAdmin()) {
  // Show create button
}
```

### Auth State Access

```typescript
// In components
const { user, isAuthenticated } = useAuthStore();

// Outside components
const state = useAuthStore.getState();
```

## Testing Considerations

Required tests:

- Token refresh race conditions
- Concurrent API requests
- Network failure handling
- Token expiry scenarios
- Permission checks

## Environment Variables

```env
VITE_API_URL=http://localhost:3001/api  # Backend API URL
```

## Common Issues & Solutions

### Issue: Token not refreshing

Check: Network tab for refresh request, console for errors

### Issue: User logged out unexpectedly

Causes: Token expired, network error, backend invalidation

### Issue: Infinite redirect loop

Check: ProtectedRoute logic, auth state initialization

## Future Enhancements

1. **Biometric Auth**: FaceID/TouchID for mobile
2. **Remember Me**: Extended session options
3. **Device Management**: Track logged-in devices
4. **Session Timeout Warning**: Alert before logout
5. **Secure Token Storage**: Implement secure alternatives

## Dependencies

- zustand: State management
- axios: HTTP client
- zustand/middleware: Persistence

## Performance Optimizations

1. **Selective Rehydration**: Only restore non-sensitive data
2. **Request Caching**: Prevent duplicate API calls
3. **Optimistic Updates**: Update UI before API confirmation
4. **Token Prerefresh**: Refresh before expiry

## Related Documentation

- Backend Auth: `/libs/backend/auth/CLAUDE.md`
- Shared Types: `/libs/shared/types/src/lib/auth/`
- Main App: `/apps/frontend/CLAUDE.md`
