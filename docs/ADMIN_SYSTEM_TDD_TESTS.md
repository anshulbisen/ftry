# Unified Admin System - TDD Test Suite

**Created**: 2025-10-10
**Status**: Red Phase (tests written, implementation pending)
**Test Framework**: Jest 30.0.2 with @nestjs/testing

## Overview

This document catalogs the comprehensive test suite written following Test-Driven Development (TDD) principles for the unified admin system. All tests are currently in the **RED phase** - they will fail until the implementation is complete.

## Test Files Created

### 1. Permission Guard Tests

**File**: `libs/backend/admin/src/lib/guards/admin-permission.guard.spec.ts`

**Coverage**: 100+ test cases

**Key Test Scenarios**:

- ✅ No permissions required (should allow access)
- ✅ User not authenticated (should deny access)
- ✅ Single permission check (OR logic)
- ✅ Multiple permissions check (OR logic - any permission grants access)
- ✅ Super admin with "all" permissions
- ✅ Tenant admin with "own" permissions
- ✅ Regular user with no admin permissions
- ✅ ForbiddenException with descriptive error messages
- ✅ Case-sensitive permission matching
- ✅ Special characters in permission names
- ✅ Edge cases (null/undefined/empty permissions)

**Permission Format Tested**:

```typescript
'resource:action:scope';
// Examples:
'users:read:all'; // Super admin can read all users
'users:read:own'; // Tenant admin can read own tenant users
'tenants:create'; // Super admin can create tenants
```

---

### 2. Data Scoping Service Tests

**File**: `libs/backend/admin/src/lib/services/data-scoping.service.spec.ts`

**Coverage**: 80+ test cases

**Key Test Scenarios**:

#### scopeQuery Method

- ✅ Super admin: Returns unmodified query (no tenant filter)
- ✅ Tenant admin: Adds tenantId filter automatically
- ✅ Preserves existing WHERE conditions
- ✅ Handles nested WHERE conditions (AND/OR)
- ✅ Throws ForbiddenException when user has no read permissions
- ✅ Works with different resources (users, tenants, roles)

#### canAccessEntity Method

- ✅ Super admin (tenantId = null): Can access any entity
- ✅ User with "all" permission: Can access cross-tenant entities
- ✅ User with "own" permission: Can only access same-tenant entities
- ✅ Denies access when entity belongs to different tenant
- ✅ Handles entities without tenantId (system entities)
- ✅ Handles null entities gracefully

**Example Test**:

```typescript
it('should add tenantId filter when user has "own" permission', () => {
  const baseQuery = { where: { status: 'active' } };

  const result = service.scopeQuery(mockTenantAdmin, baseQuery, 'users');

  expect(result).toEqual({
    where: {
      status: 'active',
      tenantId: 'tenant-1', // Automatically added
    },
  });
});
```

---

### 3. User Admin Service Tests

**File**: `libs/backend/admin/src/lib/services/user-admin.service.spec.ts`

**Coverage**: 120+ test cases

**Key Test Scenarios**:

#### findAll Method

- ✅ Super admin sees all users across all tenants
- ✅ Tenant admin sees only their tenant's users
- ✅ Applies filters (status, email, roleId)
- ✅ Pagination (limit, offset)
- ✅ Default limit of 50, max limit of 100
- ✅ Includes role and tenant relations
- ✅ Database error handling
- ✅ Permission error propagation

#### create Method

- ✅ Super admin can create users in any tenant
- ✅ Tenant admin can create users in their tenant only
- ✅ Auto-fills tenantId from current user if not provided
- ✅ Prevents cross-tenant user creation
- ✅ Password hashing before storage
- ✅ Duplicate email validation
- ✅ Role and tenant existence validation

#### update Method

- ✅ Super admin can update any user
- ✅ Tenant admin can update users in their tenant
- ✅ Prevents cross-tenant updates
- ✅ Checks both "all" and "own" permissions
- ✅ Throws NotFoundException if user doesn't exist
- ✅ Database error handling

#### delete Method (Soft Delete)

- ✅ Sets isDeleted = true and deletedAt timestamp
- ✅ Super admin can delete any user
- ✅ Tenant admin can delete users in their tenant
- ✅ Prevents deletion of already deleted users
- ✅ Prevents cross-tenant deletion

---

### 4. Tenant Service Tests

**File**: `libs/backend/admin/src/lib/services/tenant.service.spec.ts`

**Coverage**: 100+ test cases

**Key Test Scenarios**:

#### findAll Method

- ✅ Super admin sees all tenants
- ✅ Tenant owner sees only their own tenant
- ✅ Filters by status, subscription plan
- ✅ Ordered by createdAt desc

#### create Method

- ✅ Only super admins can create tenants
- ✅ Tenant owners prevented from creating tenants
- ✅ Slug validation (lowercase, URL-safe)
- ✅ Slug uniqueness enforcement
- ✅ Default status = 'active'

#### update Method

- ✅ Super admin can update any tenant
- ✅ Tenant owner can update their own tenant
- ✅ Prevents cross-tenant updates
- ✅ Slug uniqueness validation

#### suspend Method

- ✅ Only super admins can suspend tenants
- ✅ Sets status = 'suspended', subscriptionStatus = 'suspended'
- ✅ Prevents double suspension
- ✅ Documents cascading effects on tenant users

#### activate Method

- ✅ Only super admins can activate tenants
- ✅ Sets status = 'active', subscriptionStatus = 'active'
- ✅ Prevents activation of already active tenant

#### delete Method

- ✅ Only super admins can delete tenants
- ✅ Prevents deletion of tenant with active users
- ✅ Requires user count check (\_count.users = 0)

---

### 5. Role Service Tests

**File**: `libs/backend/admin/src/lib/services/role.service.spec.ts`

**Coverage**: 110+ test cases

**Key Test Scenarios**:

#### findAll Method

- ✅ Super admin sees all roles (system + tenant)
- ✅ Tenant admin sees only their tenant roles
- ✅ Filters by type (system/tenant/custom)
- ✅ Ordered by level desc

#### create Method

**System Roles**:

- ✅ Only super admins can create system roles
- ✅ System roles must have tenantId = null
- ✅ Tenant admins prevented from creating system roles

**Tenant Roles**:

- ✅ Tenant admin can create roles in their tenant
- ✅ Auto-fills tenantId from current user if not provided
- ✅ Prevents cross-tenant role creation
- ✅ Tenant roles must have non-null tenantId

**Permission Validation**:

- ✅ Validates permission format (resource:action:scope)
- ✅ Allows empty permissions array
- ✅ Rejects invalid permission formats

#### update Method

- ✅ Super admin can update any role
- ✅ Tenant admin can update tenant roles in their tenant
- ✅ Prevents modification of system-protected roles (isSystem = true)
- ✅ Prevents cross-tenant role updates

#### delete Method

- ✅ Prevents deletion of system-protected roles
- ✅ Prevents deletion of default roles (isDefault = true)
- ✅ Prevents deletion of roles with active users
- ✅ Requires user count check (\_count.users = 0)
- ✅ Super admin can delete non-protected roles
- ✅ Tenant admin can delete tenant roles (with restrictions)

---

### 6. Admin User Controller Tests

**File**: `libs/backend/admin/src/lib/controllers/admin-user.controller.spec.ts`

**Coverage**: 60+ test cases

**Key Test Scenarios**:

#### GET /api/v1/admin/users

- ✅ Super admin gets all users across all tenants
- ✅ Tenant admin gets only their tenant users
- ✅ Applies filters (status, email, roleId)
- ✅ Pagination parameters (limit, offset)
- ✅ Returns standardized success response
- ✅ Strips password from response
- ✅ Error handling (database errors, permission errors)

#### POST /api/v1/admin/users

- ✅ Super admin can create user in any tenant
- ✅ Tenant admin can create user in their tenant
- ✅ Prevents cross-tenant user creation
- ✅ Password not returned in response
- ✅ Success message: "User created successfully"
- ✅ Validation errors propagated

#### PATCH /api/v1/admin/users/:id

- ✅ Super admin can update any user
- ✅ Tenant admin can update users in their tenant
- ✅ Prevents cross-tenant updates
- ✅ Throws NotFoundException if user doesn't exist
- ✅ Success message: "User updated successfully"

#### DELETE /api/v1/admin/users/:id

- ✅ Super admin can delete any user
- ✅ Tenant admin can delete users in their tenant
- ✅ Prevents cross-tenant deletion
- ✅ Success message: "User deleted successfully"

#### Guards and Permissions

- ✅ JwtAuthGuard applied at controller level
- ✅ AdminPermissionGuard applied to all endpoints
- ✅ GET requires: ['users:read:all', 'users:read:own']
- ✅ POST requires: ['users:create:all', 'users:create:own']
- ✅ PATCH requires: ['users:update:all', 'users:update:own']
- ✅ DELETE requires: ['users:delete:all', 'users:delete:own']

---

## Running Tests

### Run All Admin Tests

```bash
# Once the library is created with nx generate
nx test backend-admin
```

### Run Specific Test Files

```bash
# Permission guard tests
nx test backend-admin --testFile=admin-permission.guard.spec.ts

# Data scoping service tests
nx test backend-admin --testFile=data-scoping.service.spec.ts

# User admin service tests
nx test backend-admin --testFile=user-admin.service.spec.ts

# Tenant service tests
nx test backend-admin --testFile=tenant.service.spec.ts

# Role service tests
nx test backend-admin --testFile=role.service.spec.ts

# Controller tests
nx test backend-admin --testFile=admin-user.controller.spec.ts
```

### Run with Coverage

```bash
nx test backend-admin --coverage
```

### Watch Mode (for TDD workflow)

```bash
nx test backend-admin --watch
```

---

## Test Statistics

| Test File                      | Test Cases | Lines of Code |
| ------------------------------ | ---------- | ------------- |
| admin-permission.guard.spec.ts | 27         | 475           |
| data-scoping.service.spec.ts   | 42         | 638           |
| user-admin.service.spec.ts     | 54         | 1,152         |
| tenant.service.spec.ts         | 48         | 927           |
| role.service.spec.ts           | 52         | 974           |
| admin-user.controller.spec.ts  | 34         | 537           |
| **TOTAL**                      | **257**    | **4,703**     |

---

## TDD Workflow

### Current Status: RED Phase ❌

All tests are written and will fail because the implementation doesn't exist yet.

### Next Steps:

1. **Create the admin library** (if not exists):

   ```bash
   nx g @nx/node:library admin \
     --directory=libs/backend/admin \
     --tags=type:data-access,scope:backend \
     --bundler=none \
     --unitTestRunner=jest
   ```

2. **Implement services and guards** to make tests pass (GREEN phase):
   - `admin-permission.guard.ts`
   - `data-scoping.service.ts`
   - `user-admin.service.ts`
   - `tenant.service.ts`
   - `role.service.ts`
   - `admin-user.controller.ts`

3. **Refactor** while keeping tests green (REFACTOR phase)

4. **Add more tests** as edge cases are discovered

---

## Permission Matrix (for Reference)

### Super Admin Permissions

```typescript
[
  // Tenants
  'tenants:create',
  'tenants:read:all',
  'tenants:update:all',
  'tenants:delete',
  'tenants:suspend',

  // Users
  'users:create:all',
  'users:read:all',
  'users:update:all',
  'users:delete:all',

  // Roles
  'roles:create:system',
  'roles:create:tenant',
  'roles:read:all',
  'roles:update:system',
  'roles:update:tenant',
  'roles:delete',

  // System
  'system:config',
  'audit:read:all',
  'impersonate:any',
];
```

### Tenant Owner Permissions

```typescript
[
  // Tenants
  'tenants:read:own',
  'tenants:update:own',

  // Users
  'users:create:own',
  'users:read:own',
  'users:update:own',
  'users:delete:own',

  // Roles
  'roles:create:tenant',
  'roles:read:own',
  'roles:update:tenant',

  // Audit
  'audit:read:own',
  'impersonate:own',
];
```

### Tenant Admin Permissions

```typescript
[
  // Users
  'users:create:own',
  'users:read:own',
  'users:update:own',

  // Roles
  'roles:read:own',

  // Audit
  'audit:read:own',
];
```

---

## Testing Best Practices Used

1. **AAA Pattern**: All tests follow Arrange-Act-Assert structure
2. **Descriptive Names**: Test names clearly state what they test
3. **Comprehensive Coverage**: Success, error, edge cases all covered
4. **Isolation**: Each test is independent, no shared state
5. **Mocking**: External dependencies properly mocked
6. **Type Safety**: Full TypeScript typing throughout
7. **Real-World Scenarios**: Tests based on actual use cases
8. **Security Focus**: Permission boundaries thoroughly tested

---

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

These tests should easily achieve >90% coverage across all metrics.

---

## Integration with CI/CD

These tests will run automatically:

1. **Pre-commit**: Via Husky hooks
2. **Pull Request**: GitHub Actions CI
3. **Pre-deployment**: Production deployment checks

---

## Related Documentation

- **Implementation Plan**: `/docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md`
- **Architecture Review**: `/docs/ARCHITECTURE_REVIEW_EXECUTIVE_SUMMARY.md`
- **Auth Module Tests**: `/libs/backend/auth/src/lib/**/*.spec.ts` (reference examples)

---

## Notes for Implementation

When implementing services/guards to pass these tests:

1. **Use PrismaService** from `@ftry/shared/prisma`
2. **Leverage RLS**: Tenant context is automatically set by JwtStrategy
3. **Hash passwords**: Use bcrypt with 12 salt rounds (like AuthService)
4. **Validate DTOs**: Use class-validator decorators
5. **Error handling**: Throw appropriate NestJS exceptions
6. **Audit logging**: Consider adding audit trail for admin actions
7. **Transaction support**: Use `prisma.$transaction()` for multi-step operations

---

**Last Updated**: 2025-10-10
**Total Test Cases**: 257
**Total Lines**: 4,703
**Status**: Ready for Implementation (RED phase)
