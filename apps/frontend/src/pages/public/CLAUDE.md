# Public Pages - Authentication UI

Component documentation for public-facing authentication pages.

## Overview

Public pages handle unauthenticated user flows: login, registration, password reset, and landing page. These pages are wrapped in `PublicRoute` which redirects authenticated users to the dashboard.

## Component Architecture

### LoginPage.tsx

**Purpose**: User authentication via email/password or demo credentials

**Dependencies**:

- `useAuth` hook for authentication logic
- `useNavigate` for post-login navigation
- shadcn/ui components (Button, Input, Label, Alert)
- Lucide icons for visual elements

**State Management**:

```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Key Features**:

- Email/password form with HTML5 validation
- Demo login button (auto-fills credentials)
- Error display with accessible Alert component
- Loading states with disabled inputs
- Links to registration and forgot password

**Accessibility**:

- Proper form labels with htmlFor
- Required field indicators
- Error alerts with role="alert"
- Disabled state management
- Keyboard navigation support

**Known Issues**:

1. Duplicate error handling in handleSubmit and handleDemoLogin
2. No client-side validation beyond HTML5 required
3. Inline onChange handlers (performance issue)
4. No field-level validation errors

**Recommended Improvements**:

```typescript
// 1. Extract error handling
const handleAuthError = useCallback((err: unknown): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || 'Invalid email or password';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}, []);

// 2. Add validation
const validateForm = (): boolean => {
  const errors: { email?: string; password?: string } = {};

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password.trim()) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  setErrors(errors);
  return Object.keys(errors).length === 0;
};

// 3. Memoize event handlers
const handleEmailChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  },
  [errors.email],
);
```

**Testing Considerations**:

- Test successful login flow
- Test error states (invalid credentials, network errors)
- Test demo login functionality
- Test navigation to registration/forgot password
- Test form validation
- Test accessibility (keyboard navigation, screen reader)

---

### RegisterPage.tsx

**Purpose**: New user account creation

**Current Status**: INCOMPLETE - Only demo registration button implemented

**Dependencies**:

- `useAuth` hook (register method)
- shadcn/ui components
- Lucide UserPlus icon

**Critical Issues**:

1. No actual registration form - only demo button
2. No input fields for user data
3. No validation logic
4. Incomplete user experience

**Required Implementation**:

```typescript
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

// Add form state
const [formData, setFormData] = useState<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
});

const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

// Implement validation
const validateForm = (): boolean => {
  // See full implementation in main review report
};

// Implement form submission
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault();

  if (!validateForm()) return;

  setError(null);
  setLoading(true);

  try {
    await register(
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.password,
      formData.phone || undefined,
    );
    navigate(ROUTES.APP.DASHBOARD);
  } catch (err: unknown) {
    setError(getAuthErrorMessage(err));
  } finally {
    setLoading(false);
  }
};
```

**Required Form Fields**:

1. First Name (required)
2. Last Name (required)
3. Email (required, validated)
4. Phone (optional, validated format)
5. Password (required, min 6 chars)
6. Confirm Password (required, must match)

**Accessibility Requirements**:

- Field labels with htmlFor
- Error messages with aria-describedby
- aria-invalid for fields with errors
- Proper focus management
- Loading states

**Testing Requirements**:

- Form validation (all fields)
- Password matching
- Email format validation
- Phone format validation (optional)
- Successful registration flow
- Error handling (duplicate email, network errors)
- Accessibility compliance

---

## Shared Patterns

### Form Structure

```typescript
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="fieldId">Field Label</Label>
    <Input
      id="fieldId"
      type="text"
      value={value}
      onChange={handleChange}
      aria-invalid={!!errors.field}
      aria-describedby={errors.field ? 'field-error' : undefined}
      required
      disabled={loading}
    />
    {errors.field && (
      <p id="field-error" className="text-sm text-destructive">
        {errors.field}
      </p>
    )}
  </div>
</form>
```

### Error Handling Pattern

```typescript
try {
  await authOperation();
  navigate(destination);
} catch (err: unknown) {
  if (isAxiosError(err)) {
    setError(err.response?.data?.message || 'Operation failed');
  } else if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unexpected error occurred. Please try again.');
  }
} finally {
  setLoading(false);
}
```

### Loading State Pattern

```typescript
<Button type="submit" disabled={loading} className="w-full" size="lg">
  {loading ? 'Processing...' : 'Submit'}
</Button>
```

---

## Component Composition Opportunities

### Reusable FormField Component

```typescript
// Create apps/frontend/src/components/common/FormField.tsx
interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>{label}</Label>
        <Input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
```

### Password Strength Component

```typescript
// Create apps/frontend/src/components/common/PasswordStrength.tsx
interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = calculateStrength(password);

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full ${
              level <= strength.score ? strength.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strength.label}</p>
    </div>
  );
}
```

---

## Performance Considerations

### Memoization

```typescript
// Memoize the entire component if props don't change
export const LoginPage = memo(() => {
  // ... component code
});

LoginPage.displayName = 'LoginPage';

// Memoize event handlers
const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setEmail(e.target.value);
}, []);
```

### Code Splitting

```typescript
// Lazy load public pages in router
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() =>
  import('./LoginPage').then(m => ({ default: m.LoginPage }))
);

// In router config
{
  path: ROUTES.PUBLIC.LOGIN,
  element: (
    <Suspense fallback={<PageSkeleton />}>
      <LoginPage />
    </Suspense>
  ),
}
```

---

## Validation Library Integration

### Using Zod for Type-Safe Validation

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^\+?[\d\s-()]+$/)
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('LoginPage', () => {
  it('should render login form', () => {
    renderWithAuth(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    renderWithAuth(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('should display validation errors', async () => {
    renderWithAuth(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    renderWithAuth(<App />);

    // Navigate to login
    await userEvent.click(screen.getByRole('link', { name: /sign in/i }));

    // Fill form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify navigation to dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests

```typescript
import { axe } from 'jest-axe';

it('should not have accessibility violations', async () => {
  const { container } = renderWithAuth(<LoginPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Future Enhancements

1. **OAuth Integration**: Google, Microsoft, Facebook login buttons
2. **Multi-factor Authentication**: SMS/Email OTP support
3. **Biometric Support**: Face/Touch ID for mobile
4. **Password Reset Flow**: Complete forgot password implementation
5. **Email Verification**: Post-registration email verification
6. **Rate Limiting UI**: Show lockout countdown after failed attempts
7. **Session Management**: "Remember Me" checkbox functionality
8. **Internationalization**: Multi-language support for Indian market

---

## Related Files

- `apps/frontend/src/hooks/useAuth.ts` - Authentication hook
- `apps/frontend/src/routes/PublicRoute.tsx` - Route guard
- `apps/frontend/src/components/layouts/PublicLayout.tsx` - Layout wrapper
- `apps/frontend/src/constants/routes.ts` - Route definitions
- `libs/frontend/auth/src/lib/auth.api.ts` - API client
- `libs/frontend/auth/src/lib/auth.store.ts` - Zustand store

---

## Refactoring Priorities

### High Priority

1. Complete RegisterPage implementation with full form
2. Extract duplicate error handling logic
3. Add comprehensive form validation
4. Implement FormField reusable component

### Medium Priority

5. Add password strength indicator
6. Memoize event handlers and components
7. Create useForm custom hook
8. Add field-level validation errors

### Low Priority

9. Add OAuth provider buttons (preparation)
10. Implement rate limiting UI
11. Add session timeout warning
12. Create loading skeletons

---

Last Updated: 2025-10-08
