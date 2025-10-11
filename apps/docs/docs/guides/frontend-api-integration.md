# Frontend API Integration

HTTP-only cookie authentication, automatic CSRF protection, and error handling for React frontend.

**Status**: Production Ready | **Last Updated**: 2025-10-11

## Architecture

```
Components → Hooks → API Layer → Backend
  (UI)       (State)    (HTTP)      (NestJS)

API Layer:
├── api-client.ts    # HTTP client with CSRF
├── csrf.ts          # CSRF token management
└── useAuth.ts       # Authentication operations
```

## Core Files

### 1. API Client (`apps/frontend/src/lib/api-client.ts`)

HTTP client wrapper with automatic CSRF token injection.

**Features**:

- Automatic CSRF for POST/PUT/PATCH/DELETE
- Cookie-based authentication (credentials: 'include')
- Auto Content-Type for JSON
- Error handling with token refresh on 403

**Usage**:

```typescript
import { api } from '@/lib/api-client';

// GET (no CSRF)
const response = await api.get('/api/v1/users');
const data = await response.json();

// POST (CSRF auto-included)
const response = await api.post('/api/v1/users', {
  firstName: 'John',
  email: 'john@example.com',
});

// PUT
const response = await api.put(`/api/v1/users/${userId}`, updateData);

// DELETE
const response = await api.delete(`/api/v1/users/${userId}`);

// Skip CSRF (for public endpoints)
const response = await api.post('/api/public/contact', data, {
  skipCsrf: true,
});
```

### 2. CSRF Token Manager (`apps/frontend/src/lib/csrf.ts`)

Fetch and cache CSRF tokens.

**Functions**:

#### `getCsrfToken(): Promise<string>`

Fetches CSRF token. Returns cached if available.

```typescript
import { getCsrfToken } from '@/lib/csrf';

const token = await getCsrfToken();
```

#### `clearCsrfToken(): void`

Clears cached token. Used on 403 errors.

```typescript
import { clearCsrfToken } from '@/lib/csrf';

clearCsrfToken(); // Next request fetches new token
```

#### `prefetchCsrfToken(): Promise<void>`

Prefetch token without blocking. Best-effort.

```typescript
import { prefetchCsrfToken } from '@/lib/csrf';

// In app initialization
useEffect(() => {
  prefetchCsrfToken();
}, []);
```

### 3. Authentication Hook (`apps/frontend/src/hooks/useAuth.ts`)

Centralized authentication operations.

**Usage**:

```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { login, logout, isAuthenticated, isLoading, user } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid credentials');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthenticated) {
    return <div>Welcome, {user?.firstName}</div>;
  }

  return <LoginForm onSubmit={handleLogin} />;
}
```

**Return Type**:

```typescript
interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}
```

**Important**:

1. No token management (handled via cookies)
2. No navigation (component's responsibility)
3. Error handling required by caller

## Authentication Flow

### Login

```typescript
// 1. User submits credentials
await login(email, password);

// 2. Behind the scenes:
//    - apiClient adds CSRF token
//    - Backend validates credentials
//    - Backend sets HTTP-only cookies:
//      * accessToken (15 min)
//      * refreshToken (7 days)
//    - Backend returns user data (NO tokens)

// 3. Subsequent requests auto-include cookies
const response = await api.get('/api/v1/auth/me');
```

### Logout

```typescript
// 1. User initiates logout
await logout();

// 2. Behind the scenes:
//    - apiClient adds CSRF token
//    - Backend revokes refresh token
//    - Backend clears cookies (maxAge=0)
//    - Frontend clears auth state

// 3. Redirect to login
navigate('/login');
```

### Token Refresh (Automatic)

```typescript
// 1. Access token expires (15 min)
//    - apiClient detects 401 on protected endpoint
//    - Automatically calls /api/v1/auth/refresh

// 2. Refresh endpoint:
//    - Reads refreshToken from cookie
//    - Validates in database
//    - Generates new tokens
//    - Sets new cookies (rotation)
//    - Revokes old refresh token

// 3. Original request retried
//    - Seamless user experience
```

## CSRF Protection

### How It Works

1. **Token Fetch**:

   ```typescript
   const token = await getCsrfToken();
   // Backend sets CSRF cookie (_csrf)
   // Returns token in response body
   ```

2. **State-Changing Requests**:

   ```typescript
   await api.post('/api/v1/users', data);
   // Header: X-CSRF-Token: <token>
   // Cookie: _csrf=<same-token>
   ```

3. **Backend Validation**:
   ```typescript
   // Backend compares header vs cookie
   if (headerToken !== cookieToken) {
     throw new ForbiddenException();
   }
   ```

### Protected Methods

- ✅ POST, PUT, PATCH, DELETE
- ❌ GET, HEAD, OPTIONS (read-only, no CSRF)

### Error Handling

```typescript
try {
  const response = await api.post('/api/v1/users', data);
} catch (error) {
  // If 403, apiClient auto-clears CSRF token
  // Next request will fetch new token
}
```

## Error Handling

### Network Errors

```typescript
try {
  const response = await api.get('/api/v1/users');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Network error (offline, DNS failure)');
  } else {
    console.error('Request error', error);
  }
}
```

### Authentication Errors

```typescript
try {
  await login(email, password);
} catch (error) {
  if (error.status === 401) {
    setError('Invalid credentials');
  } else if (error.status === 423) {
    setError('Account locked. Try in 15 minutes.');
  } else if (error.status === 429) {
    setError('Too many attempts. Try later.');
  }
}
```

## Best Practices

### ✅ DO

**Always use `api` helper**:

```typescript
import { api } from '@/lib/api-client';
await api.post('/api/v1/users', data);
```

**Let cookies handle tokens**:

```typescript
await api.get('/api/v1/auth/me');
// Cookies sent automatically
```

**Handle navigation in components**:

```typescript
await login(email, password);
navigate('/dashboard'); // Component handles navigation
```

**Prefetch CSRF token**:

```typescript
// In App.tsx
useEffect(() => {
  prefetchCsrfToken();
}, []);
```

**Use TypeScript types**:

```typescript
import type { SafeUser, ApiResponse } from '@ftry/shared/types';

const response = await api.get('/api/v1/auth/me');
const result: ApiResponse<SafeUser> = await response.json();
```

### ❌ DON'T

**Use raw fetch** (missing CSRF, credentials):

```typescript
// ❌ Bad
fetch('/api/v1/users', { method: 'POST', body: JSON.stringify(data) });

// ✅ Good
api.post('/api/v1/users', data);
```

**Manually add Authorization header**:

```typescript
// ❌ Bad (cookies handle this)
api.get('/api/v1/auth/me', {
  headers: { Authorization: `Bearer ${token}` },
});

// ✅ Good
api.get('/api/v1/auth/me');
```

## Security

### HTTP-Only Cookies

**Benefit**: Tokens inaccessible to JavaScript (XSS protection)

```typescript
// ❌ Cannot access cookies from JavaScript
const token = document.cookie; // Won't find accessToken
localStorage.getItem('token'); // Not used

// ✅ Cookies sent automatically
await api.get('/api/v1/auth/me');
```

### CSRF Protection

**Benefit**: Prevents cross-site request forgery

```typescript
// Attacker's site tries:
// <form action="https://ftry.com/api/v1/users/delete" method="POST">
// </form>

// ❌ Fails because:
// 1. No CSRF token
// 2. Can't read httpOnly cookie
// 3. Browser won't send CSRF header cross-domain
```

### SameSite Cookies

**Benefit**: Additional CSRF protection

```typescript
// Cookie configuration (backend):
{
  httpOnly: true,
  secure: true,      // HTTPS only
  sameSite: 'strict' // No cross-site sends
}
```

## Testing

### API Client Tests

```typescript
import { vi } from 'vitest';
import { api } from '@/lib/api-client';
import * as csrf from '@/lib/csrf';

describe('API Client', () => {
  beforeEach(() => {
    vi.spyOn(csrf, 'getCsrfToken').mockResolvedValue('mock-token');
  });

  it('includes CSRF in POST', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await api.post('/api/v1/users', { name: 'John' });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-csrf-token': 'mock-token',
        }),
      }),
    );
  });

  it('does NOT include CSRF in GET', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await api.get('/api/v1/users');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/users',
      expect.not.objectContaining({
        headers: expect.objectContaining({
          'x-csrf-token': expect.anything(),
        }),
      }),
    );
  });
});
```

## Troubleshooting

### "Failed to fetch CSRF token"

**Cause**: Backend not running or CORS misconfigured

**Solution**:

```bash
# 1. Verify backend running
nx serve backend

# 2. Check CORS in apps/backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true // REQUIRED for cookies
});
```

### "403 Forbidden" on POST

**Cause**: Missing or invalid CSRF token

**Solution**:

```typescript
// 1. Verify token fetch
const token = await getCsrfToken();
console.log('CSRF token:', token);

// 2. Clear cache and retry
clearCsrfToken();
await api.post('/api/v1/users', data);
```

### "401 Unauthorized" on authenticated requests

**Cause**: Access token expired or missing

**Solution**:

```typescript
// 1. Verify cookies sent (DevTools → Network → Headers)
// Should see: Cookie: accessToken=...; refreshToken=...

// 2. Check credentials: 'include' (auto in apiClient)

// 3. Try logging in again
await login(email, password);
```

### Cookies not being set

**Cause**: CORS or secure context issue

**Solution**:

```typescript
// 1. Ensure same domain or proper CORS
// Frontend: http://localhost:4200
// Backend: http://localhost:3001
// CORS: credentials: true

// 2. In production, ensure HTTPS
// Cookies with secure: true require HTTPS

// 3. Check SameSite setting
// 'strict' requires same-site requests
// Use 'lax' for cross-subdomain if needed
```

## Related Documentation

- [Authentication Guide](./authentication)
- [Environment Variables](./environment-variables)
- [Testing Guide](./testing)
