# Custom Hooks - Frontend Logic Layer

Documentation for React custom hooks providing reusable business logic and state management.

## Overview

Custom hooks encapsulate shared logic, API interactions, and state management patterns. They follow React hooks rules and naming conventions (prefix with `use`).

## Current Hooks

### useAuth.ts

**Purpose**: Centralized authentication operations and state access

**Type**: API Integration + State Management Hook

**Dependencies**:

- `@ftry/frontend/auth` - Zustand auth store
- `@ftry/frontend/auth` - Auth API client
- `@ftry/shared/types` - SafeUser type

**Return Type**:

```typescript
interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  logout: () => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone?: string,
    roleId?: string,
    tenantId?: string,
  ) => Promise<SafeUser>;
  updateUser: (user: AuthUser) => void;
}
```

**Key Methods**:

#### login(email, password)

- Authenticates user with email/password
- Updates Zustand store with tokens and user data
- Returns SafeUser object
- Throws error on failure (caller handles)
- **NOTE**: Does NOT handle navigation (caller's responsibility)

```typescript
const { login } = useAuth();

try {
  await login('user@example.com', 'password123');
  navigate(ROUTES.APP.DASHBOARD);
} catch (error) {
  setError(getAuthErrorMessage(error));
}
```

#### logout()

- Revokes refresh token on backend
- Clears Zustand auth state
- Silent fail on backend error (always clears local state)
- **NOTE**: Does NOT handle navigation (caller's responsibility)

```typescript
const { logout } = useAuth();

await logout();
navigate(ROUTES.PUBLIC.LOGIN);
```

#### register(firstName, lastName, email, password, phone?, roleId?, tenantId?)

- Creates new user account
- Returns SafeUser object
- **ISSUE**: Does NOT auto-login after registration
- **ISSUE**: Does NOT set auth state in store

```typescript
const { register } = useAuth();

try {
  const user = await register('John', 'Doe', 'john@example.com', 'password123');
  // BUG: User not authenticated, must call login separately
  navigate(ROUTES.PUBLIC.LOGIN); // Workaround
} catch (error) {
  setError(getAuthErrorMessage(error));
}
```

#### updateUser(user)

- Updates user data in Zustand store
- Local state only (no API call)
- Used after profile updates

**Known Issues**:

1. **Missing Loading State Management** (Lines 17, 44)
   - `isLoading` exists in store but never set to true
   - Hook should manage loading state during API calls

2. **Register Doesn't Auto-Login** (Lines 59-78)
   - User data returned but not stored in auth state
   - Inconsistent with login behavior
   - Forces manual login after registration

3. **No Return Type Memoization** (Lines 80-89)
   - Returns new object on every render
   - Causes unnecessary re-renders in consumers
   - Should use useMemo

4. **Missing Error Standardization**
   - Raw errors thrown, not transformed
   - Caller must handle different error types
   - Should provide consistent error format

**Recommended Improvements**:

```typescript
// 1. Add proper loading state management
const login = async (email: string, password: string): Promise<SafeUser> => {
  setLoading(true);
  try {
    const response = await authApi.login(email, password);
    setAuth(response.user, response.accessToken, response.refreshToken);
    return response.user;
  } finally {
    setLoading(false);
  }
};

// 2. Auto-login after registration
const register = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone?: string,
  roleId?: string,
  tenantId?: string,
): Promise<SafeUser> => {
  setLoading(true);
  try {
    const response = await authApi.register({
      firstName,
      lastName,
      email,
      password,
      phone,
      roleId: roleId || '',
      tenantId,
    });

    // Auto-login if backend returns tokens
    if (response.accessToken) {
      setAuth(response.user, response.accessToken, response.refreshToken);
    }

    return response.user;
  } finally {
    setLoading(false);
  }
};

// 3. Memoize return object
import { useMemo } from 'react';

return useMemo(
  () => ({
    user,
    token: accessToken,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser: setUser,
  }),
  [user, accessToken, isAuthenticated, login, logout, register, setUser],
);

// 4. Add explicit return type
export function useAuth(): UseAuthReturn {
  // ... implementation
}
```

**Best Practices**:

- Always handle navigation in component, not hook
- Always wrap API calls in try-catch
- Check isAuthenticated before calling protected operations
- Use token for API Authorization header (handled by apiClient)

**Testing**:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const user = await result.current.login('test@example.com', 'password');
      expect(user).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle login error', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await expect(result.current.login('invalid@example.com', 'wrong')).rejects.toThrow();
    });
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
```

---

## Recommended New Hooks

### useForm

**Purpose**: Generic form state management with validation

**Location**: `apps/frontend/src/hooks/useForm.ts`

```typescript
import { useState, useCallback, FormEvent } from 'react';
import { z } from 'zod';

interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
  setFieldError: (field: keyof T, error: string) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof T) => {
      return (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      };
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof T] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [values, validationSchema]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, onSubmit, values],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setFieldError: (field: keyof T, error: string) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
  };
}
```

**Usage**:

```typescript
const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
  initialValues: { email: '', password: '' },
  validationSchema: loginSchema,
  onSubmit: async (values) => {
    await login(values.email, values.password);
    navigate(ROUTES.APP.DASHBOARD);
  },
});

<form onSubmit={handleSubmit}>
  <Input
    value={values.email}
    onChange={handleChange('email')}
    error={errors.email}
  />
</form>
```

---

### useAuthNavigation

**Purpose**: Standardized navigation after auth operations

**Location**: `apps/frontend/src/hooks/useAuthNavigation.ts`

```typescript
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { ROUTES } from '@/constants/routes';

export function useAuthNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateAfterLogin = useCallback(() => {
    const state = location.state as { from?: { pathname: string } } | null;
    const from = state?.from?.pathname || ROUTES.APP.DASHBOARD;
    navigate(from, { replace: true });
  }, [navigate, location]);

  const navigateToLogin = useCallback(
    (preserveLocation = true) => {
      navigate(ROUTES.PUBLIC.LOGIN, {
        state: preserveLocation ? { from: location } : undefined,
        replace: true,
      });
    },
    [navigate, location],
  );

  const navigateToRegister = useCallback(() => {
    navigate(ROUTES.PUBLIC.REGISTER, { replace: true });
  }, [navigate]);

  return {
    navigateAfterLogin,
    navigateToLogin,
    navigateToRegister,
  };
}
```

**Usage**:

```typescript
const { navigateAfterLogin } = useAuthNavigation();

try {
  await login(email, password);
  navigateAfterLogin(); // Goes to intended page or dashboard
} catch (error) {
  setError(getAuthErrorMessage(error));
}
```

---

### useSessionTimeout

**Purpose**: Automatic logout on inactivity

**Location**: `apps/frontend/src/hooks/useSessionTimeout.ts`

```typescript
import { useEffect, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();
  const [warningId, setWarningId] = useState<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    if (warningId) clearTimeout(warningId);
    setShowWarning(false);

    const newWarningId = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    const newTimeoutId = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);

    setWarningId(newWarningId);
    setTimeoutId(newTimeoutId);
  }, [logout, timeoutId, warningId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (warningId) clearTimeout(warningId);
    };
  }, [isAuthenticated, resetTimer]);

  return { showWarning, extendSession: resetTimer };
}
```

**Usage**:

```typescript
// In AppLayout.tsx
const { showWarning, extendSession } = useSessionTimeout();

{showWarning && (
  <Dialog open={showWarning}>
    <DialogContent>
      <DialogTitle>Session Expiring Soon</DialogTitle>
      <DialogDescription>
        Your session will expire in 5 minutes due to inactivity.
      </DialogDescription>
      <Button onClick={extendSession}>Stay Logged In</Button>
    </DialogContent>
  </Dialog>
)}
```

---

### useRateLimit

**Purpose**: Client-side rate limiting with lockout

**Location**: `apps/frontend/src/hooks/useRateLimit.ts`

```typescript
import { useState, useCallback } from 'react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export function useRateLimit(key: string) {
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const isLocked = useCallback(() => {
    if (!lockedUntil) return false;
    if (new Date() > lockedUntil) {
      setLockedUntil(null);
      setAttempts(0);
      return false;
    }
    return true;
  }, [lockedUntil]);

  const recordAttempt = useCallback(() => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCKOUT_TIME);
      setLockedUntil(lockUntil);
    }
  }, [attempts]);

  const reset = useCallback(() => {
    setAttempts(0);
    setLockedUntil(null);
  }, []);

  return {
    attempts,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts),
    isLocked: isLocked(),
    lockedUntil,
    recordAttempt,
    reset,
  };
}
```

**Usage**:

```typescript
const { isLocked, remainingAttempts, recordAttempt, reset } = useRateLimit('login');

const handleSubmit = async () => {
  if (isLocked) {
    setError('Too many failed attempts. Please try again later.');
    return;
  }

  try {
    await login(email, password);
    reset(); // Success - reset counter
  } catch (error) {
    recordAttempt();
    setError(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
  }
};
```

---

### useOAuth

**Purpose**: OAuth provider authentication

**Location**: `apps/frontend/src/hooks/useOAuth.ts`

```typescript
import { useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useOAuth() {
  const loginWithGoogle = useCallback(async () => {
    window.location.href = `${API_URL}/auth/google`;
  }, []);

  const loginWithMicrosoft = useCallback(async () => {
    window.location.href = `${API_URL}/auth/microsoft`;
  }, []);

  const loginWithFacebook = useCallback(async () => {
    window.location.href = `${API_URL}/auth/facebook`;
  }, []);

  return {
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithFacebook,
  };
}
```

**Usage**:

```typescript
const { loginWithGoogle } = useOAuth();

<Button onClick={loginWithGoogle} variant="outline">
  <GoogleIcon className="mr-2" />
  Continue with Google
</Button>
```

---

## Hook Design Principles

### 1. Single Responsibility

Each hook should have one clear purpose:

- ✅ `useAuth` - Authentication operations
- ✅ `useForm` - Form state management
- ❌ `useAuthAndProfile` - Too broad

### 2. Consistent Naming

- Prefix with `use` (React convention)
- Use descriptive, action-based names
- Examples: `useAuth`, `useForm`, `useSessionTimeout`

### 3. Proper Dependencies

- Include all variables used from outer scope in dependencies
- Use ESLint rule `react-hooks/exhaustive-deps`
- Memoize callbacks with `useCallback`
- Memoize computed values with `useMemo`

### 4. Type Safety

- Define explicit return types
- Use TypeScript generics for reusable hooks
- Export interfaces for hook return types

### 5. Error Handling

- Let errors bubble up to caller
- Provide optional error transformation
- Document expected errors in JSDoc

### 6. Side Effects

- Clearly document side effects
- Clean up in useEffect return
- Avoid side effects in render phase

---

## Testing Hooks

### Setup

```typescript
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
```

### Testing Async Operations

```typescript
it('should handle async login', async () => {
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.login('test@example.com', 'password');
  });

  expect(result.current.isAuthenticated).toBe(true);
});
```

### Testing State Updates

```typescript
it('should update form values', () => {
  const { result } = renderHook(() => useForm({ initialValues: { email: '' } }));

  act(() => {
    result.current.handleChange('email')({
      target: { value: 'test@example.com' },
    } as any);
  });

  expect(result.current.values.email).toBe('test@example.com');
});
```

---

## Performance Optimization

### Memoization

```typescript
// ✅ Memoize callbacks
const login = useCallback(async (email: string, password: string) => {
  // ... implementation
}, []); // Only recreate if dependencies change

// ✅ Memoize computed values
const hasPermission = useMemo(() => user?.permissions.includes(permission), [user, permission]);

// ✅ Memoize return object
return useMemo(() => ({ user, login, logout }), [user, login, logout]);
```

### Avoid Unnecessary Re-renders

```typescript
// ❌ New object on every render
return { user, token, isAuthenticated };

// ✅ Memoized object
return useMemo(() => ({ user, token, isAuthenticated }), [user, token, isAuthenticated]);
```

---

## Common Patterns

### Conditional Hook Execution

```typescript
// ❌ Don't do this - violates Rules of Hooks
if (condition) {
  useAuth(); // ERROR
}

// ✅ Execute logic conditionally, not hook
const auth = useAuth();
if (condition) {
  // Use auth
}
```

### Combining Multiple Hooks

```typescript
export function useAuthenticatedUser() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return user;
}
```

### Custom Hook with Cleanup

```typescript
export function useEventListener(event: string, handler: () => void) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler]);
}
```

---

## Related Files

- `libs/frontend/auth/src/lib/auth.store.ts` - Zustand store
- `libs/frontend/auth/src/lib/auth.api.ts` - API client
- `apps/frontend/src/pages/public/LoginPage.tsx` - Hook consumer
- `apps/frontend/src/routes/ProtectedRoute.tsx` - Auth guard

---

## Future Hook Ideas

1. `usePermissions` - Permission checking utilities
2. `useProfile` - User profile management
3. `useNotifications` - Real-time notifications
4. `useWebSocket` - WebSocket connection management
5. `usePagination` - Pagination state management
6. `useDebounce` - Debounced values
7. `useLocalStorage` - Persisted state in localStorage
8. `useMediaQuery` - Responsive breakpoint detection

---

Last Updated: 2025-10-08
