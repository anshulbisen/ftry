# Testing Guide

Comprehensive testing strategy and patterns for ftry, following Test-Driven Development (TDD) principles.

## Overview

ftry uses a **test-first approach** with comprehensive test coverage across unit, integration, and end-to-end tests.

**Testing Stack**:

- **Frontend**: Vitest + React Testing Library + jsdom
- **Backend**: Jest + Supertest + testcontainers
- **E2E**: (Future) Playwright
- **Coverage**: 80%+ target across all projects

## Testing Philosophy

### Test-Driven Development (TDD)

**Always write tests BEFORE implementation**:

1. **Red**: Write failing test
2. **Green**: Implement minimal code to pass
3. **Refactor**: Clean up while keeping tests green
4. **Commit**: Only commit with passing tests

### Test Pyramid

```
        ┌───────────┐
        │    E2E    │  ← Few (slow, expensive)
        └───────────┘
       ┌─────────────┐
       │ Integration │  ← Some (medium speed)
       └─────────────┘
      ┌───────────────┐
      │     Unit      │  ← Many (fast, isolated)
      └───────────────┘
```

**Target Distribution**:

- **70%** Unit tests
- **20%** Integration tests
- **10%** E2E tests

## Frontend Testing (Vitest)

### Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Component Testing

```typescript
// UserProfile.spec.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserProfile } from './UserProfile';
import { createMockUser } from '@/test/factories';

describe('UserProfile', () => {
  it('should render user name', () => {
    const user = createMockUser({ firstName: 'John', lastName: 'Doe' });
    render(<UserProfile user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render user email', () => {
    const user = createMockUser({ email: 'john@example.com' });
    render(<UserProfile user={user} />);

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render user role', () => {
    const user = createMockUser({
      role: { name: 'Administrator', ...defaultRole },
    });
    render(<UserProfile user={user} />);

    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// usePermissions.spec.tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePermissions } from './usePermissions';
import { createMockUser } from '@/test/factories';
import { AuthProvider } from '@/providers/AuthProvider';

describe('usePermissions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should return false for missing permission', () => {
    const user = createMockUser({ permissions: ['users:read:own'] });
    const { result } = renderHook(() => usePermissions(user), { wrapper });

    expect(result.current.hasPermission('users:delete:all')).toBe(false);
  });

  it('should return true for existing permission', () => {
    const user = createMockUser({ permissions: ['users:read:all'] });
    const { result } = renderHook(() => usePermissions(user), { wrapper });

    expect(result.current.hasPermission('users:read:all')).toBe(true);
  });

  it('should handle OR logic (any permission)', () => {
    const user = createMockUser({ permissions: ['users:read:own'] });
    const { result } = renderHook(() => usePermissions(user), { wrapper });

    const hasAny = result.current.hasAnyPermission([
      'users:read:all',
      'users:read:own',
    ]);

    expect(hasAny).toBe(true);
  });

  it('should handle AND logic (all permissions)', () => {
    const user = createMockUser({
      permissions: ['users:read:all', 'users:update:all'],
    });
    const { result } = renderHook(() => usePermissions(user), { wrapper });

    const hasAll = result.current.hasAllPermissions([
      'users:read:all',
      'users:update:all',
    ]);

    expect(hasAll).toBe(true);
  });
});
```

### TanStack Query Testing

```typescript
// useUsers.spec.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { useUsers } from './useUsers';
import { adminApi } from '@/lib/admin/admin.api';

// Mock API
vi.mock('@/lib/admin/admin.api', () => ({
  adminApi: {
    users: {
      list: vi.fn(),
    },
  },
}));

describe('useUsers', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch users successfully', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One' },
      { id: '2', email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
    ];

    vi.mocked(adminApi.users.list).mockResolvedValueOnce(mockUsers);

    const { result } = renderHook(() => useUsers(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUsers);
  });

  it('should handle errors', async () => {
    vi.mocked(adminApi.users.list).mockRejectedValueOnce(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch');
  });
});
```

### Test Factories

```typescript
// src/test/factories.ts
import type { SafeUser, Role, Tenant } from '@ftry/shared/types';

export function createMockRole(overrides?: Partial<Role>): Role {
  return {
    id: 'role-123',
    name: 'User',
    description: 'Basic user role',
    permissions: ['users:read:own'],
    tenantId: null,
    type: 'system',
    level: 1,
    isSystem: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function createMockTenant(overrides?: Partial<Tenant>): Tenant {
  return {
    id: 'tenant-123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    description: 'Test tenant description',
    logo: null,
    website: 'https://example.com',
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    subscriptionExpiry: null,
    maxUsers: 10,
    settings: {},
    metadata: {},
    status: 'active',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

export function createMockUser(overrides?: Partial<SafeUser>): SafeUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    tenantId: null,
    roleId: 'role-123',
    status: 'active',
    isDeleted: false,
    lastLogin: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    role: createMockRole(),
    tenant: null,
    permissions: [],
    ...overrides,
  };
}
```

## Backend Testing (Jest)

### Setup

```typescript
// jest.config.ts
export default {
  displayName: 'backend-auth',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/backend/auth',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/**/*.integration.spec.ts'],
};
```

### Unit Tests

```typescript
// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@ftry/backend/prisma';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        status: 'active',
        loginAttempts: 0,
        lockedUntil: null,
        role: { permissions: ['users:read:own'] },
        tenant: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        status: 'active',
        loginAttempts: 0,
        lockedUntil: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        status: 'active',
        loginAttempts: 4,
        lockedUntil: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      const updateSpy = jest.spyOn(prisma.user, 'update');

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Account locked',
      );

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            loginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: null,
        roleId: 'role-123',
        role: { permissions: ['users:read:own'] },
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-token');
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as any);

      const tokens = await service.generateTokens(mockUser as any);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
    });
  });
});
```

### Integration Tests

```typescript
// jwt.strategy.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '@ftry/backend/prisma';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from '@ftry/shared/types';

describe('JwtStrategy (Integration)', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            setTenantContext: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('validate', () => {
    it('should set RLS context before querying user', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        roleId: 'role-123',
        permissions: ['users:read:own'],
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        status: 'active',
        isDeleted: false,
        role: { permissions: ['users:read:own'] },
        tenant: { id: 'tenant-123', name: 'Test Tenant' },
      };

      const setContextSpy = jest.spyOn(prisma, 'setTenantContext');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await strategy.validate(payload);

      // CRITICAL: RLS context must be set BEFORE query
      expect(setContextSpy).toHaveBeenCalledWith('tenant-123');
      expect(setContextSpy).toHaveBeenCalledBefore(prisma.user.findUnique);
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: null,
        roleId: 'role-123',
        permissions: [],
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        status: 'active',
        isDeleted: true, // Soft deleted
        role: { permissions: [] },
        tenant: null,
      };

      jest.spyOn(prisma, 'setTenantContext').mockResolvedValue();
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### API Testing (Supertest)

```typescript
// auth.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '@ftry/backend/prisma';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('expiresIn');

      // Check cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      }

      // 6th attempt should return locked error
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Account locked');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      // First login
      const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

      const cookies = loginResponse.headers['set-cookie'];
      const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

      // Refresh tokens
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie!)
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('success', true);

      // New tokens should be set
      const newCookies = refreshResponse.headers['set-cookie'];
      expect(newCookies.some((c: string) => c.startsWith('accessToken='))).toBe(true);
      expect(newCookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
    });
  });
});
```

## Running Tests

### Frontend Tests

```bash
# Run all frontend tests
nx test frontend

# Run tests in watch mode
nx test frontend --watch

# Run tests with coverage
nx test frontend --coverage

# Run specific test file
nx test frontend --testFile=UserProfile.spec.tsx

# Run tests matching pattern
nx test frontend --testNamePattern="should render"
```

### Backend Tests

```bash
# Run all backend tests
nx test backend-auth

# Run tests in watch mode
nx test backend-auth --watch

# Run tests with coverage
nx test backend-auth --coverage

# Run only unit tests
nx test backend-auth --testPathIgnorePatterns=integration

# Run only integration tests
nx test backend-auth --testPathPattern=integration
```

### All Projects

```bash
# Run all tests across all projects
bun run test

# Run affected tests only
nx affected --target=test

# Run tests with coverage for all projects
bun run test:coverage
```

## Test Coverage

### Coverage Reports

```bash
# Generate coverage report
nx test frontend --coverage

# View HTML coverage report
open coverage/apps/frontend/index.html
```

### Coverage Targets

| Project       | Target | Current   |
| ------------- | ------ | --------- |
| Frontend      | 80%    | 85% ✅    |
| Backend Auth  | 90%    | 92% ✅    |
| Backend Admin | 80%    | 78% ⚠️    |
| Shared Types  | N/A    | Type-only |

## Common Testing Patterns

### 1. Mocking API Calls

```typescript
import { vi } from 'vitest';
import { adminApi } from '@/lib/admin/admin.api';

vi.mock('@/lib/admin/admin.api', () => ({
  adminApi: {
    users: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
```

### 2. Testing Async Code

```typescript
it('should fetch data asynchronously', async () => {
  const { result } = renderHook(() => useUsers());

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toBeDefined();
});
```

### 3. Testing Error States

```typescript
it('should handle errors gracefully', async () => {
  vi.mocked(api.fetchData).mockRejectedValueOnce(new Error('Network error'));

  const { result } = renderHook(() => useData());

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
  });

  expect(result.current.error?.message).toBe('Network error');
});
```

### 4. Testing User Interactions

```typescript
import { fireEvent } from '@testing-library/react';

it('should submit form on button click', async () => {
  const handleSubmit = vi.fn();
  render(<Form onSubmit={handleSubmit} />);

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });
});
```

## CI/CD Integration

Tests run automatically on every commit and PR via GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run lint
        run: bun run lint

      - name: Run type check
        run: bun run typecheck

      - name: Run tests
        run: bun run test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/*/coverage-final.json
```

## Troubleshooting

### Test Timeout

**Error**: `Test exceeded timeout of 5000ms`

**Solution**:

```typescript
it('should complete long operation', async () => {
  // Increase timeout for this test
  const result = await someAsyncOperation();
  expect(result).toBeDefined();
}, 10000); // 10 second timeout
```

### Module Not Found

**Error**: `Cannot find module '@/components/...'`

**Solution**: Check path aliases in `vite.config.ts` or `jest.config.ts`

### React Hook Errors

**Error**: `Hooks can only be called inside the body of a function component`

**Solution**: Use `renderHook` from `@testing-library/react`

## Best Practices

### DO ✅

- Write tests before implementation (TDD)
- Use descriptive test names
- Test user behavior, not implementation
- Use test factories for complex objects
- Mock external dependencies
- Clean up after each test
- Aim for 80%+ coverage

### DON'T ❌

- Test implementation details
- Commit failing tests
- Skip flaky tests (fix them!)
- Over-mock (use real code when possible)
- Ignore warnings
- Test third-party libraries

## See Also

- [Type Safety Guide](./type-safety.md) - Type-safe test mocks
- [Contributing Guide](./contributing.md) - Code quality standards
- [Changelog](./changelog.md) - Recent testing improvements

---

**Last Updated**: 2025-10-11
**Test Framework**: Vitest (frontend), Jest (backend)
**Coverage Target**: 80%+
**CI**: GitHub Actions
