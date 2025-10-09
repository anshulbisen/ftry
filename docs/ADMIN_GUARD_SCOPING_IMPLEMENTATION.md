# Admin Guard and Data Scoping Implementation

**Date**: 2025-10-10
**Status**: ✅ COMPLETED
**Phase**: Foundation (Week 1 - Part 1)

## Overview

Successfully implemented the core infrastructure for the unified admin system's permission-based access control and data scoping. This implementation follows Test-Driven Development (TDD) principles with all 46 tests passing.

## What Was Implemented

### 1. AdminPermissionGuard (`libs/backend/admin/src/lib/guards/admin-permission.guard.ts`)

**Purpose**: Enforces permission-based access control for admin endpoints using OR logic.

**Features**:

- Extracts permissions from `@RequirePermissions` decorator metadata
- Checks if user has ANY of the required permissions (flexible access model)
- Returns `false` for unauthenticated users (lets JwtAuthGuard handle auth errors)
- Throws `ForbiddenException` with detailed permission list when access is denied
- Uses constant `PERMISSIONS_KEY` for metadata key consistency

**Key Implementation Details**:

```typescript
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());

    // No permissions required -> allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;

    // No user or no permissions -> deny (return false, not throw)
    if (!user || !user.permissions) {
      return false;
    }

    // OR logic: user needs ANY of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Required permissions: ${requiredPermissions.join(' OR ')}`);
    }

    return true;
  }
}
```

**Design Decision**: Uses exact permission matching (no hierarchical logic). A route requiring `users:read:own` will NOT accept `users:read:all`. This is intentional - developers must explicitly list both permissions if both should have access:

```typescript
@RequirePermissions(['users:read:all', 'users:read:own']) // Accepts both
```

**Test Coverage**: 19 tests, 100% passing

- Permission checking logic (OR logic, exact matching)
- Unauthenticated user handling
- Edge cases (empty permissions, null permissions, case sensitivity)
- Reflector metadata retrieval

### 2. RequirePermissions Decorator (`libs/backend/admin/src/lib/decorators/require-permissions.decorator.ts`)

**Purpose**: Marks endpoints as requiring specific permissions.

**Features**:

- Simple decorator using NestJS `SetMetadata`
- Exports `PERMISSIONS_KEY` constant for consistency
- Accepts array of permission strings (OR logic)

**Implementation**:

```typescript
export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

**Usage Example**:

```typescript
@Get('/users')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
@RequirePermissions(['users:read:all', 'users:read:own'])
async getUsers(@CurrentUser() user: User) {
  return this.userService.findAll(user);
}
```

### 3. DataScopingService (`libs/backend/admin/src/lib/services/data-scoping.service.ts`)

**Purpose**: Automatically scopes database queries based on user permissions and provides entity-level access checks.

**Features**:

- `scopeQuery()`: Modifies Prisma queries to add tenant filters
- `canAccessEntity()`: Checks if user can access a specific entity
- `validateTenantAccess()`: Validates tenant access for mutations
- `getRoleScope()`: Returns role query filters

**Key Methods**:

#### scopeQuery(user, query, resource)

Automatically adds `tenantId` filter to queries based on permissions:

- User has `resource:read:all` → Returns query unchanged (super admin)
- User has `resource:read:own` → Adds `where: { tenantId: user.tenantId }`
- No read permission → Throws `ForbiddenException`

```typescript
scopeQuery(user, query, resource) {
  if (user.permissions?.includes(`${resource}:read:all`)) {
    return query; // Super admin - no filtering
  }

  if (user.permissions?.includes(`${resource}:read:own`)) {
    return {
      ...query,
      where: {
        ...query.where,
        tenantId: user.tenantId, // Add tenant filter
      },
    };
  }

  throw new ForbiddenException('Insufficient permissions');
}
```

#### canAccessEntity(user, entity, permission)

Checks if user can access a specific entity:

- Super admin (`tenantId === null`) → Always returns `true`
- Permission ends with `:all` → Checks if user has that permission
- Permission ends with `:own` → Checks permission AND entity matches user's tenant
- Otherwise → Returns `false`

```typescript
canAccessEntity(user, entity, permission) {
  if (!entity) return false;

  // Super admin can access everything
  if (user.tenantId === null) return true;

  // Cross-tenant access
  if (permission.endsWith(':all')) {
    return user.permissions?.includes(permission) || false;
  }

  // Same-tenant access
  if (permission.endsWith(':own')) {
    return (
      user.permissions?.includes(permission) &&
      entity.tenantId === user.tenantId
    );
  }

  return false;
}
```

**Test Coverage**: 27 tests, 100% passing

- Super admin access (full access, different tenants)
- Tenant-scoped queries (adds tenantId filter)
- Entity-level access checks (:all vs :own)
- Edge cases (null entity, missing tenantId, no permissions)

### 4. Module Configuration (`libs/backend/admin/src/lib/admin.module.ts`)

**Setup**:

- Imports `PrismaModule` for database access
- Provides `AdminPermissionGuard` and `DataScopingService`
- Exports services for use in other modules
- Properly configured NestJS module with dependency injection

## Test Results

```bash
$ bun test libs/backend/admin/src/lib/guards/admin-permission.guard.spec.ts \
              libs/backend/admin/src/lib/services/data-scoping.service.spec.ts

✅ 46 tests pass
✅ 0 tests fail
✅ 54 expect() calls

Breakdown:
- AdminPermissionGuard: 19 tests
- DataScopingService: 27 tests
```

## Permission Model

### Permission Format

```
resource:action:scope
```

**Examples**:

- `users:read:all` - Read all users across tenants (super admin)
- `users:read:own` - Read users in own tenant only (tenant admin)
- `users:create:own` - Create users in own tenant
- `tenants:delete` - Delete tenants (no scope = super admin only)

### Permission Scopes

- `:all` - Cross-tenant access (super admin level)
- `:own` - Tenant-scoped access (tenant admin level)
- No scope - Typically super admin only

### Access Control Flow

1. **Route Protection** (Guard level):

   ```typescript
   @UseGuards(JwtAuthGuard, AdminPermissionGuard)
   @RequirePermissions(['users:read:all', 'users:read:own'])
   ```

   - JwtAuthGuard ensures user is authenticated
   - AdminPermissionGuard checks if user has ANY of the listed permissions

2. **Data Scoping** (Service level):

   ```typescript
   async findAll(user: User, filters: any) {
     let query = { where: filters };
     // Automatically add tenantId filter if needed
     query = this.scopingService.scopeQuery(user, query, 'users');
     return this.prisma.user.findMany(query);
   }
   ```

3. **Entity Access** (Before mutations):

   ```typescript
   async update(user: User, userId: string, dto: UpdateUserDto) {
     const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });

     // Check if user can access this specific entity
     const canUpdate = this.scopingService.canAccessEntity(
       user,
       targetUser,
       'users:update:own'
     ) || this.scopingService.canAccessEntity(
       user,
       targetUser,
       'users:update:all'
     );

     if (!canUpdate) {
       throw new ForbiddenException('Cannot update this user');
     }

     return this.prisma.user.update({ where: { id: userId }, data: dto });
   }
   ```

## Architecture Benefits

### 1. Defense in Depth

- **Layer 1**: JWT authentication (user must be logged in)
- **Layer 2**: Permission guard (user must have required permissions)
- **Layer 3**: Data scoping (query automatically filtered)
- **Layer 4**: Entity-level checks (before mutations)

### 2. Flexibility

- OR logic allows multiple permission levels to access same route
- Easy to add new resources without changing infrastructure
- Permission model scales from simple to complex use cases

### 3. Security

- Exact permission matching prevents accidental privilege escalation
- Automatic query scoping prevents data leaks
- Super admin properly isolated (tenantId = null)

### 4. Maintainability

- Single guard implementation for all admin routes
- Consistent permission checking across the application
- Easy to test (46 unit tests cover all scenarios)

## Integration with Existing Systems

### Row-Level Security (RLS)

The data scoping service complements (not replaces) RLS:

- **RLS**: Database-level enforcement (defense in depth)
- **DataScopingService**: Application-level optimization (better queries, clearer errors)

Both work together:

```typescript
// JWT Strategy sets RLS context
await this.prisma.setTenantContext(user.tenantId);

// DataScopingService optimizes query
const query = this.scopingService.scopeQuery(user, baseQuery, 'users');

// Prisma executes with both:
// 1. Application-level WHERE clause (from DataScopingService)
// 2. Database-level RLS policy (from setTenantContext)
const users = await this.prisma.user.findMany(query);
```

### JWT Authentication

Guard integrates seamlessly with existing JWT auth:

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminPermissionGuard) // Both required
export class UserController {
  @Get()
  @RequirePermissions(['users:read:all', 'users:read:own'])
  async getUsers(@CurrentUser() user: UserWithPermissions) {
    // user.permissions already populated by JwtStrategy
    return this.service.findAll(user);
  }
}
```

## Next Steps

### Immediate (DO NOT IMPLEMENT - Per User Request)

The following service implementations are stubbed but NOT implemented:

- `TenantService` - Tenant CRUD operations
- `UserAdminService` - User management for admins
- `RoleService` - Role and permission management
- `PermissionService` - Permission metadata operations

### Testing Status

- ✅ Guard tests: 19/19 passing
- ✅ Scoping tests: 27/27 passing
- ⏳ Service tests: 78 failing (expected - services not implemented yet)
- ⏳ Controller tests: Not yet implemented

### Documentation Created

- `/docs/ADMIN_GUARD_SCOPING_IMPLEMENTATION.md` (this file)
- Updated `/docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md` with actual implementations

## Usage Examples

### Basic Route Protection

```typescript
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class TenantController {
  @Get()
  @RequirePermissions(['tenants:read:all', 'tenants:read:own'])
  async getTenants(@CurrentUser() user: UserWithPermissions) {
    // Super admin sees all tenants
    // Tenant admin sees only their tenant
    return this.tenantService.findAll(user);
  }

  @Post()
  @RequirePermissions(['tenants:create']) // Only super admin
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }
}
```

### Service with Data Scoping

```typescript
@Injectable()
export class UserAdminService {
  constructor(
    private prisma: PrismaService,
    private scopingService: DataScopingService,
  ) {}

  async findAll(user: UserWithPermissions, filters: UserFilterDto) {
    // Build base query
    let query = {
      where: filters.where || {},
      include: { role: true, tenant: true },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    };

    // Apply automatic scoping
    query = this.scopingService.scopeQuery(user, query, 'users');

    // Execute scoped query
    return this.prisma.user.findMany(query);
  }

  async update(user: UserWithPermissions, userId: string, dto: UpdateUserDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check entity-level access
    const canUpdate =
      this.scopingService.canAccessEntity(user, targetUser, 'users:update:all') ||
      this.scopingService.canAccessEntity(user, targetUser, 'users:update:own');

    if (!canUpdate) {
      throw new ForbiddenException('Cannot update this user');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
```

### Multiple Permission Levels

```typescript
@Get('users')
@RequirePermissions([
  'users:read:all',    // Super admin
  'users:read:own',    // Tenant admin
  'users:read:team',   // Team lead (future)
])
async getUsers(@CurrentUser() user: UserWithPermissions) {
  // Guard accepts ANY of these permissions
  // Service automatically scopes data based on which permission user has
  return this.userService.findAll(user);
}
```

## File Locations

### Implemented Files

- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/guards/admin-permission.guard.ts`
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/guards/admin-permission.guard.spec.ts`
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/decorators/require-permissions.decorator.ts`
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/services/data-scoping.service.ts`
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/services/data-scoping.service.spec.ts`
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/admin.module.ts`
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/index.ts`

### Test Files

- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/guards/admin-permission.guard.spec.ts` (19 tests)
- `/Users/anshulbisen/projects/personal/ftry/libs/backend/admin/src/lib/services/data-scoping.service.spec.ts` (27 tests)

## Verification Commands

```bash
# Run guard tests
bun test libs/backend/admin/src/lib/guards/admin-permission.guard.spec.ts

# Run scoping service tests
bun test libs/backend/admin/src/lib/services/data-scoping.service.spec.ts

# Run both (foundation infrastructure)
bun test libs/backend/admin/src/lib/guards/admin-permission.guard.spec.ts \
         libs/backend/admin/src/lib/services/data-scoping.service.spec.ts

# Format code
bun run format libs/backend/admin/src/lib/guards/admin-permission.guard.ts \
               libs/backend/admin/src/lib/decorators/require-permissions.decorator.ts \
               libs/backend/admin/src/lib/services/data-scoping.service.ts
```

## Summary

✅ **Completed**: Core infrastructure for unified admin system
✅ **Test Coverage**: 46/46 tests passing (100%)
✅ **Code Quality**: All files formatted with Prettier
✅ **Architecture**: Defense-in-depth security with multiple layers
✅ **Documentation**: Comprehensive implementation guide created

🎯 **Ready For**: Service layer implementation (Phase 2)
⏳ **Waiting**: User confirmation before implementing TenantService, UserAdminService, RoleService

---

**Implementation Date**: 2025-10-10
**Implemented By**: Claude Code (Backend Expert)
**Methodology**: Test-Driven Development (TDD)
**Status**: Phase 1 Foundation - COMPLETE ✅
