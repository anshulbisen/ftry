# Frontend API Integration Guide

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-08
**Tech Stack**: React 19 + TypeScript + Fetch API

## Overview

This document describes the frontend API integration layer, including HTTP-only cookie authentication, automatic CSRF protection, and error handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                             │
├─────────────────────────────────────────────────────────────┤
│  Components  →  Hooks  →  API Layer  →  Backend             │
│  (UI Logic)     (State)    (HTTP)        (NestJS)           │
└─────────────────────────────────────────────────────────────┘

API Layer Components:
├── api-client.ts         # HTTP client with CSRF protection
├── csrf.ts               # CSRF token management
└── hooks/useAuth.ts      # Authentication operations
```

## Core Files

### 1. API Client (`apps/frontend/src/lib/api-client.ts`)

**Purpose**: HTTP client wrapper with automatic CSRF token injection

**Features**:

- Automatic CSRF token injection for state-changing requests
- Cookie-based authentication (credentials: 'include')
- Automatic Content-Type header for JSON
- Error handling with token refresh on 403

**Usage**:

```typescript
import { api } from '@/lib/api-client';

// GET request (no CSRF needed)
const response = await api.get('/api/v1/users');
const data = await response.json();

// POST request (CSRF token automatically included)
const response = await api.post('/api/v1/users', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
});

// PUT request
const response = await api.put(`/api/v1/users/${userId}`, updateData);

// DELETE request
const response = await api.delete(`/api/v1/users/${userId}`);

// Skip CSRF for specific request
const response = await api.post('/api/public/contact', data, {
  skipCsrf: true,
});
```

**Implementation Details**:

```typescript
// Automatic CSRF injection
const method = (fetchOptions.method || 'GET').toUpperCase();
const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

if (needsCsrf) {
  const csrfToken = await getCsrfToken();
  fetchOptions.headers = {
    ...fetchOptions.headers,
    'x-csrf-token': csrfToken,
  };
}

// Automatic credentials inclusion
fetchOptions.credentials = 'include'; // Required for cookies

// Automatic 403 handling
if (response.status === 403 && needsCsrf) {
  clearCsrfToken(); // Force token refresh on next request
}
```

### 2. CSRF Token Manager (`apps/frontend/src/lib/csrf.ts`)

**Purpose**: Fetch and cache CSRF tokens

**Features**:

- Token caching to avoid unnecessary requests
- Automatic token refresh on 403 errors
- Prefetch capability for app initialization

**Functions**:

#### `getCsrfToken(): Promise<string>`

Fetches a CSRF token from the backend. Returns cached token if available.

```typescript
import { getCsrfToken } from '@/lib/csrf';

const token = await getCsrfToken();
// Token cached for subsequent requests
```

#### `clearCsrfToken(): void`

Clears the cached CSRF token. Used when token becomes invalid (403 error).

```typescript
import { clearCsrfToken } from '@/lib/csrf';

// On 403 error
clearCsrfToken();
// Next request will fetch a new token
```

#### `prefetchCsrfToken(): Promise<void>`

Prefetches CSRF token without returning it. Best-effort, doesn't throw on failure.

```typescript
import { prefetchCsrfToken } from '@/lib/csrf';

// In app initialization (App.tsx)
useEffect(() => {
  prefetchCsrfToken();
}, []);
```

**Implementation Details**:

```typescript
let csrfToken: string | null = null; // Module-level cache

export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken; // Return cached

  const response = await fetch('/api/csrf-token', {
    credentials: 'include', // Required for CSRF cookie
  });

  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}
```

### 3. Authentication Hook (`apps/frontend/src/hooks/useAuth.ts`)

**Purpose**: Centralized authentication operations

**Features**:

- Login with email/password
- Logout (revoke refresh token)
- Access to auth state (user, isAuthenticated, isLoading)
- Automatic token handling (via HTTP-only cookies)

**Usage**:

```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { login, logout, isAuthenticated, isLoading, user } = useAuth();
  const [error, setError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Tokens automatically set as HTTP-only cookies
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

**Important Notes**:

1. **No Token Management**: Tokens are handled automatically via HTTP-only cookies
2. **No Navigation**: Hook does NOT handle navigation (component's responsibility)
3. **Error Handling**: Caller must handle errors from login/logout
4. **Loading State**: `isLoading` reflects current operation state

## Authentication Flow

### Login Flow

```typescript
// 1. User submits credentials
const { login } = useAuth();
await login(email, password);

// 2. Behind the scenes:
//    - apiClient adds CSRF token to request
//    - Backend validates credentials
//    - Backend sets HTTP-only cookies:
//      * accessToken (15 min)
//      * refreshToken (7 days)
//    - Backend returns user data (NO tokens in response)

// 3. All subsequent requests include cookies automatically
const response = await api.get('/api/v1/auth/me');
// Cookies sent automatically by browser
```

### Logout Flow

```typescript
// 1. User initiates logout
const { logout } = useAuth();
await logout();

// 2. Behind the scenes:
//    - apiClient adds CSRF token to request
//    - Backend revokes refresh token in database
//    - Backend clears cookies (sets maxAge=0)
//    - Frontend clears auth state (Zustand store)

// 3. User redirected to login page
navigate('/login');
```

### Token Refresh Flow

```typescript
// 1. Access token expires (15 minutes)
//    - apiClient detects 401 on protected endpoint
//    - Automatically calls /api/v1/auth/refresh

// 2. Refresh endpoint:
//    - Reads refreshToken from HTTP-only cookie
//    - Validates token in database
//    - Generates new access and refresh tokens
//    - Sets new cookies (token rotation)
//    - Revokes old refresh token

// 3. Original request retried with new access token
//    - User experience: seamless, no visible error
```

## CSRF Protection

### How It Works

1. **Initial Token Fetch**:

   ```typescript
   // On app initialization
   const token = await getCsrfToken();
   // Backend sets CSRF cookie: _csrf (httpOnly)
   // Backend returns token in response body
   ```

2. **State-Changing Requests**:

   ```typescript
   // Frontend includes token in header
   await api.post('/api/v1/users', data);
   // Header: X-CSRF-Token: <token>
   // Cookie: _csrf=<same-token>
   ```

3. **Backend Validation**:
   ```typescript
   // Backend compares header token with cookie token
   if (headerToken !== cookieToken) {
     throw new ForbiddenException('Invalid CSRF token');
   }
   ```

### Protected Methods

- ✅ POST
- ✅ PUT
- ✅ PATCH
- ✅ DELETE
- ❌ GET (read-only, no CSRF needed)
- ❌ HEAD (read-only, no CSRF needed)
- ❌ OPTIONS (pre-flight, no CSRF needed)

### Error Handling

```typescript
// Automatic token refresh on 403
try {
  const response = await api.post('/api/v1/users', data);
} catch (error) {
  // If 403, apiClient automatically:
  // 1. Clears cached CSRF token
  // 2. Next request will fetch new token
}
```

## Error Handling Patterns

### Network Errors

```typescript
try {
  const response = await api.get('/api/v1/users');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  if (error instanceof TypeError) {
    // Network error (offline, DNS failure, etc.)
    console.error('Network error:', error);
  } else {
    // HTTP error or JSON parsing error
    console.error('Request error:', error);
  }
}
```

### Authentication Errors

```typescript
const { login } = useAuth();

try {
  await login(email, password);
  navigate('/dashboard');
} catch (error) {
  if (error.status === 401) {
    setError('Invalid credentials');
  } else if (error.status === 423) {
    setError('Account locked. Try again in 15 minutes.');
  } else if (error.status === 429) {
    setError('Too many login attempts. Please try again later.');
  } else {
    setError('Login failed. Please try again.');
  }
}
```

### CSRF Errors

```typescript
try {
  await api.post('/api/v1/users', data);
} catch (error) {
  if (error.status === 403) {
    // CSRF token invalid
    // apiClient already cleared token
    // Retry request (will fetch new token)
    await api.post('/api/v1/users', data);
  }
}
```

## Best Practices

### 1. Always Use `api` Helper

```typescript
// ✅ Good
import { api } from '@/lib/api-client';
await api.post('/api/v1/users', data);

// ❌ Bad
fetch('/api/v1/users', {
  method: 'POST',
  body: JSON.stringify(data),
});
// Missing CSRF token, credentials, error handling
```

### 2. Let Cookies Handle Tokens

```typescript
// ✅ Good
await api.get('/api/v1/auth/me');
// Cookies sent automatically

// ❌ Bad
await api.get('/api/v1/auth/me', {
  headers: {
    Authorization: `Bearer ${token}`, // Don't do this
  },
});
```

### 3. Handle Navigation in Components

```typescript
// ✅ Good
const { login } = useAuth();
await login(email, password);
navigate('/dashboard'); // Component handles navigation

// ❌ Bad
const { login } = useAuth();
await login(email, password);
// Hook handles navigation (too much responsibility)
```

### 4. Prefetch CSRF Token

```typescript
// In App.tsx or main.tsx
import { prefetchCsrfToken } from '@/lib/csrf';

useEffect(() => {
  prefetchCsrfToken(); // Best-effort, doesn't block
}, []);
```

### 5. Use TypeScript Types

```typescript
import type { SafeUser, ApiResponse } from '@ftry/shared/types';

const response = await api.get('/api/v1/auth/me');
const result: ApiResponse<SafeUser> = await response.json();

if (result.success) {
  console.log('User:', result.data);
}
```

## Security Considerations

### HTTP-Only Cookies

**Benefit**: Tokens inaccessible to JavaScript (XSS protection)

```typescript
// ❌ Cannot access cookies from JavaScript
const token = document.cookie; // Won't find accessToken
localStorage.getItem('token'); // Not used anymore

// ✅ Cookies sent automatically by browser
await api.get('/api/v1/auth/me');
// Browser includes cookies in request
```

### CSRF Protection

**Benefit**: Prevents cross-site request forgery attacks

```typescript
// Attacker's malicious site:
// <form action="https://yourdomain.com/api/v1/users/delete" method="POST">
//   <input type="hidden" name="userId" value="123" />
// </form>

// ❌ This will FAIL because:
// 1. Attacker doesn't have CSRF token
// 2. CSRF cookie is httpOnly (can't read it)
// 3. Browser won't send CSRF header across domains
```

### SameSite Cookies

**Benefit**: Additional CSRF protection

```typescript
// Cookie configuration (backend):
{
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict', // Don't send on cross-site requests
}

// Result:
// - Cookies sent on same-site navigation
// - Cookies NOT sent from external sites
```

## Testing

### Testing API Client

```typescript
import { vi } from 'vitest';
import { api } from '@/lib/api-client';
import * as csrf from '@/lib/csrf';

describe('API Client', () => {
  beforeEach(() => {
    vi.spyOn(csrf, 'getCsrfToken').mockResolvedValue('mock-token');
  });

  it('should include CSRF token in POST request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    await api.post('/api/v1/users', { name: 'John' });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/users',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-csrf-token': 'mock-token',
        }),
      }),
    );
  });

  it('should NOT include CSRF token in GET request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    await api.get('/api/v1/users');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/users',
      expect.objectContaining({
        method: 'GET',
        headers: expect.not.objectContaining({
          'x-csrf-token': expect.anything(),
        }),
      }),
    );
  });
});
```

### Testing Authentication Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import * as authApi from '@ftry/frontend/auth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    vi.spyOn(authApi, 'authApi').mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

## Troubleshooting

### "Failed to fetch CSRF token"

**Cause**: Backend not running or CORS misconfigured

**Solution**:

```bash
# Verify backend is running
nx serve backend

# Check CORS configuration in apps/backend/src/main.ts
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true, // REQUIRED for cookies
});
```

### "403 Forbidden" on POST requests

**Cause**: Missing or invalid CSRF token

**Solution**:

```typescript
// 1. Verify CSRF token is being fetched
const token = await getCsrfToken();
console.log('CSRF token:', token);

// 2. Check API client is adding token
// (should be automatic)

// 3. Clear token cache and retry
clearCsrfToken();
await api.post('/api/v1/users', data);
```

### "401 Unauthorized" on authenticated requests

**Cause**: Access token expired or missing

**Solution**:

```typescript
// 1. Verify cookies are being sent
// Open DevTools → Network → Request Headers
// Should see: Cookie: accessToken=...; refreshToken=...

// 2. Check credentials: 'include' is set
// (should be automatic in apiClient)

// 3. Try logging in again
await login(email, password);
```

### Cookies not being set

**Cause**: CORS or secure context issue

**Solution**:

```typescript
// 1. Ensure frontend and backend on same domain (or proper CORS)
// Frontend: http://localhost:3000
// Backend: http://localhost:3001
// CORS: credentials: true

// 2. In production, ensure HTTPS
// Cookies with secure: true require HTTPS

// 3. Check SameSite setting
// 'strict' requires same-site requests
// Use 'lax' for cross-subdomain if needed
```

## Related Documentation

- **Authentication**: [`/docs/AUTHENTICATION.md`](./AUTHENTICATION.md)
- **CSRF Implementation**: [`/docs/CSRF_MIGRATION.md`](./CSRF_MIGRATION.md)
- **Backend Security**: [`/docs/BACKEND_SECURITY_INFRASTRUCTURE_IMPLEMENTATION.md`](./BACKEND_SECURITY_INFRASTRUCTURE_IMPLEMENTATION.md)
- **Frontend Setup**: [`/apps/frontend/README.md`](../apps/frontend/README.md)

---

**Last Updated**: 2025-10-08
**Version**: 1.0.0
**Status**: Production Ready
