# Type Safety & Type System

Comprehensive guide to TypeScript type definitions and type safety patterns in ftry.

## Overview

ftry uses a **strict TypeScript** configuration across the entire monorepo to ensure type safety, prevent runtime errors, and improve developer experience with IntelliSense.

**Key Benefits**:

- Catch errors at compile time
- Self-documenting code
- Reliable refactoring
- Better IDE support

## Shared Type Library

All types are centralized in `libs/shared/types` for cross-boundary sharing between frontend and backend.

```typescript
import type { SafeUser, Tenant, Role, Permission } from '@ftry/shared/types';
```

### Package Structure

```
libs/shared/types/src/lib/
├── auth/
│   └── auth.types.ts       # Authentication & user types
├── admin/
│   └── admin.types.ts      # Admin CRUD types (future)
└── index.ts                # Re-exports
```

## Core Types

### SafeUser

**Purpose**: User data safe for client consumption (excludes sensitive fields)

```typescript
export type SafeUser = Omit<User, 'loginAttempts' | 'lockedUntil'> & {
  role: Role;
  tenant: Tenant | null;
  permissions: string[]; // ← Added in 2025-10-11
};
```

**Changes (2025-10-11)**:

- ✅ Added `permissions: string[]` field
- This enables permission checks without additional API calls
- Permissions are included in JWT payload and attached to user

**Usage**:

```typescript
// Frontend - Auth store
interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
}

// Backend - API responses
@Get('me')
async getCurrentUser(@CurrentUser() user: UserWithPermissions): Promise<SafeUser> {
  return toSafeUser(user);
}
```

**Security Note**: `SafeUser` excludes:

- `password` (never sent to client)
- `loginAttempts` (internal security state)
- `lockedUntil` (internal security state)

### Tenant

**Purpose**: Multi-tenant organization data

```typescript
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null; // ← Changed from 'domain'
  subscriptionPlan: string; // ← Required (was optional)
  subscriptionStatus: string; // ← Required (was optional)
  subscriptionExpiry?: Date | null; // ← Renamed from subscriptionEndDate
  maxUsers: number; // ← Required (was optional)
  settings?: any; // ← New: JSON configuration
  metadata?: any; // ← New: JSON metadata
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Breaking Changes (2025-10-11)**:

| Old Field            | New Field  | Type Change           | Reason                                   |
| -------------------- | ---------- | --------------------- | ---------------------------------------- |
| `domain`             | `website`  | `string?` → `string?` | More accurate naming                     |
| `subscriptionPlan`   | (same)     | `string?` → `string!` | Always required                          |
| `subscriptionStatus` | (same)     | `string?` → `string!` | Always required                          |
| `maxUsers`           | (same)     | `number?` → `number!` | Always required (defaults to plan limit) |
| N/A                  | `settings` | (new)                 | JSON configuration per tenant            |
| N/A                  | `metadata` | (new)                 | JSON metadata storage                    |

**Migration**:

```typescript
// ❌ Old code (will fail type check)
const tenant: Tenant = {
  domain: 'example.com',
  subscriptionPlan: null, // Error: Required field
};

// ✅ New code
const tenant: Tenant = {
  website: 'https://example.com',
  subscriptionPlan: 'basic', // Required
  subscriptionStatus: 'active', // Required
  maxUsers: 10, // Required
};
```

### User

**Purpose**: Complete user entity (backend only)

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  tenantId: string | null;
  roleId: string;
  status: string;
  isDeleted: boolean;
  loginAttempts: number; // ← Security: Track failed logins
  lockedUntil: Date | null; // ← Security: Account lockout
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Never use directly in frontend** - Use `SafeUser` instead.

### Role

**Purpose**: RBAC role with permissions

```typescript
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[]; // ← Array of permission names
  tenantId: string | null; // null = system role
  type: string; // 'system' | 'custom'
  level: number; // Hierarchy level
  isSystem: boolean; // Cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}
```

**Example**:

```typescript
const adminRole: Role = {
  id: 'role-admin',
  name: 'Administrator',
  permissions: ['users:read:all', 'users:create:all', 'users:update:all', 'users:delete:all'],
  tenantId: null, // System role (applies to all tenants)
  type: 'system',
  level: 100,
  isSystem: true,
};
```

### Permission

**Purpose**: Granular permission definition

```typescript
export interface Permission {
  id: string;
  name: string; // 'users:read:all'
  resource: string; // 'users'
  action: string; // 'read:all'
  description?: string | null;
  category: string; // 'User Management'
  createdAt: Date;
  updatedAt: Date;
}
```

**Naming Convention**: `{resource}:{action}:{scope}`

Examples:

- `users:read:all` - Read all users across all tenants
- `users:read:own` - Read users in own tenant only
- `appointments:create:own` - Create appointments in own tenant
- `billing:delete:all` - Delete any billing record (super admin)

## Composite Types

### UserWithPermissions

**Purpose**: User with computed permissions (backend request context)

```typescript
export type UserWithPermissions = UserWithRelations & {
  permissions: string[]; // From role + direct assignments
  additionalPermissions?: string[]; // Direct permission grants
};
```

**Usage**:

```typescript
@Controller('appointments')
export class AppointmentsController {
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(['appointments:read:own'])
  async getAppointments(@CurrentUser() user: UserWithPermissions) {
    // user.permissions available
    // user.tenantId for RLS
    return this.appointmentsService.findAll(user);
  }
}
```

### RoleWithStats

**Purpose**: Role with aggregated statistics (admin views)

```typescript
export interface RoleWithStats extends Role {
  userCount: number; // Number of users with this role
  permissionCount: number; // Number of permissions assigned
}
```

### TenantWithStats

**Purpose**: Tenant with aggregated statistics (admin views)

```typescript
export interface TenantWithStats extends Tenant {
  userCount: number; // Number of users in tenant
  roleCount?: number; // Number of custom roles
}
```

## Type Guards

Use type guards for runtime type checking:

```typescript
// Check if object is SafeUser
export function isSafeUser(user: unknown): user is SafeUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    'role' in user &&
    'permissions' in user && // ← Now checked
    typeof (user as SafeUser).id === 'string' &&
    typeof (user as SafeUser).email === 'string'
  );
}

// Usage
if (isSafeUser(data)) {
  // TypeScript knows data is SafeUser
  console.log(data.permissions);
}
```

## DTO Types

### CreateUserDto

```typescript
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  roleId: string;
}
```

### UpdateUserDto

```typescript
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  status?: string;
}
```

**Note**: `email` cannot be updated (unique identifier).

### CreateTenantDto

```typescript
export interface CreateTenantDto {
  name: string;
  slug: string;
  description?: string;
  website?: string; // ← Changed from 'domain'
  subscriptionPlan: string; // 'free' | 'basic' | 'professional' | 'enterprise'
  maxUsers: number;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

## Type Safety Patterns

### 1. Strict Null Checks

```typescript
// ✅ Good: Handle null explicitly
function getDisplayName(user: SafeUser): string {
  return user.tenant?.name ?? 'System';
}

// ❌ Bad: Assumes tenant exists
function getDisplayName(user: SafeUser): string {
  return user.tenant.name; // Error: Object is possibly 'null'
}
```

### 2. Type Assertions (Use Sparingly)

```typescript
// ✅ Good: Validate before assertion
if (isSafeUser(data)) {
  const user = data as SafeUser;
}

// ❌ Bad: Unsafe assertion
const user = data as SafeUser; // No validation
```

### 3. Discriminated Unions

```typescript
// ✅ Good: Type-safe state management
export type AuthState =
  | { type: 'unauthenticated' }
  | { type: 'authenticating' }
  | { type: 'authenticated'; user: SafeUser }
  | { type: 'error'; error: string };

function renderAuth(state: AuthState) {
  switch (state.type) {
    case 'authenticated':
      return <Dashboard user={state.user} />;  // user is available
    case 'unauthenticated':
      return <Login />;
    // ...
  }
}
```

### 4. Generic Types

```typescript
// ✅ Good: Reusable with type safety
export interface ResourceConfig<TEntity, TCreateInput, TUpdateInput> {
  hooks: {
    useList: () => UseQueryResult<TEntity[]>;
    useCreate: () => UseMutationResult<TEntity, Error, TCreateInput>;
    useUpdate: () => UseMutationResult<TEntity, Error, TUpdateInput>;
  };
}

// Usage with full type inference
const userConfig: ResourceConfig<SafeUser, CreateUserDto, UpdateUserDto> = {
  hooks: {
    useList: useUsers, // Type inferred
    useCreate: useCreateUser,
    useUpdate: useUpdateUser,
  },
};
```

## Common Type Errors & Solutions

### Error: Property 'permissions' does not exist on type 'SafeUser'

**Cause**: Using outdated type definition (before 2025-10-11)

**Solution**:

```bash
# Regenerate types
bunx prisma generate

# Rebuild affected projects
nx build shared-types

# Restart TypeScript server in IDE
# VS Code: Cmd+Shift+P → "Restart TS Server"
```

### Error: Type 'null' is not assignable to type 'string'

**Cause**: Field changed from optional to required (e.g., `subscriptionPlan`)

**Solution**:

```typescript
// Provide default value
const tenant: Tenant = {
  ...existingData,
  subscriptionPlan: existingData.subscriptionPlan || 'free',
  subscriptionStatus: existingData.subscriptionStatus || 'active',
  maxUsers: existingData.maxUsers || 5,
};
```

### Error: Property 'domain' does not exist on type 'Tenant'

**Cause**: Field renamed from `domain` to `website`

**Solution**:

```typescript
// ❌ Old
const url = tenant.domain;

// ✅ New
const url = tenant.website;
```

## Testing with Types

### Unit Tests

```typescript
import { SafeUser } from '@ftry/shared/types';

describe('UserComponent', () => {
  const mockUser: SafeUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: {
      id: 'role-123',
      name: 'Admin',
      permissions: ['users:read:all'],
      // ... other required fields
    },
    tenant: null,
    permissions: ['users:read:all'],  // ← Required
    status: 'active',
    tenantId: null,
    roleId: 'role-123',
    phone: null,
    isDeleted: false,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should render user name', () => {
    render(<UserProfile user={mockUser} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

### Type Assertion Helpers

```typescript
// Create type-safe test factories
export function createMockUser(overrides?: Partial<SafeUser>): SafeUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: createMockRole(),
    tenant: null,
    permissions: [],
    status: 'active',
    tenantId: null,
    roleId: 'role-123',
    phone: null,
    isDeleted: false,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Usage in tests
const user = createMockUser({ firstName: 'John', permissions: ['admin:all'] });
```

## Best Practices

### DO ✅

- Import types with `type` keyword: `import type { SafeUser } from '@ftry/shared/types'`
- Use type guards for runtime checks
- Define DTOs for API boundaries
- Use discriminated unions for state management
- Leverage generic types for reusability
- Keep types in shared library for cross-boundary use

### DON'T ❌

- Use `any` type (use `unknown` instead)
- Use type assertions without validation
- Define duplicate types in multiple places
- Ignore TypeScript errors (fix them!)
- Use `@ts-ignore` comments
- Export implementation details from type library

## Configuration

### TypeScript Config

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true, // Enable all strict checks
    "strictNullChecks": true, // Enforce null/undefined handling
    "noImplicitAny": true, // Disallow implicit any
    "noUnusedLocals": true, // Warn on unused variables
    "noUnusedParameters": true, // Warn on unused params
    "noImplicitReturns": true, // All code paths return
    "forceConsistentCasingInFileNames": true
  }
}
```

### Quality Checks

```bash
# Type check all projects
bun run typecheck

# Type check specific project
nx typecheck frontend
nx typecheck backend

# Type check on file save (watch mode)
nx typecheck frontend --watch
```

## Changelog

### 2025-10-11: Type Safety Improvements

**SafeUser**:

- ✅ Added `permissions: string[]` field
- Enables permission checks without additional API calls

**Tenant**:

- ✅ Renamed `domain` → `website`
- ✅ Made `subscriptionPlan` required
- ✅ Made `subscriptionStatus` required
- ✅ Made `maxUsers` required
- ✅ Added `settings?: any` field
- ✅ Added `metadata?: any` field

**Impact**: Breaking changes in admin configurations and forms

**Migration**: All tenant-related code updated to match new schema

## See Also

- [Testing Guide](./testing.md) - Testing patterns and setup
- [Authentication Architecture](../architecture/authentication.md) - SafeUser usage in auth
- [Admin CRUD Architecture](../architecture/admin-crud.md) - Type-safe admin configs

---

**Last Updated**: 2025-10-11
**Type Library**: `libs/shared/types`
**Strict Mode**: Enabled
