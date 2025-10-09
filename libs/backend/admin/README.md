# Backend Admin Library

Unified administration module for the ftry platform providing permission-based access control.

## Overview

This library implements a **unified admin system** where super admins, tenant admins, and other administrative roles share the same APIs with access controlled entirely through roles and permissions. This eliminates code duplication and provides a single source of truth for admin functionality.

## Architecture

### Permission-Based Access Control

Instead of separate implementations for different admin levels, we use a single implementation with permission-based scoping:

```typescript
// ✅ Unified endpoint with permission-based access
GET /api/v1/admin/users
  - Super admin: sees all users across all tenants
  - Tenant admin: sees only users in their tenant

// ❌ NOT separate endpoints
GET /api/v1/super-admin/users  // (we don't do this)
GET /api/v1/admin/users        // (we don't do this)
```

### Directory Structure

```
libs/backend/admin/
├── controllers/          # API endpoints with permission guards
│   ├── tenant.controller.ts
│   ├── user.controller.ts
│   ├── role.controller.ts
│   └── permission.controller.ts
├── services/            # Business logic with data scoping
│   ├── tenant.service.ts
│   ├── user-admin.service.ts
│   ├── role.service.ts
│   ├── permission.service.ts
│   └── data-scoping.service.ts
├── guards/              # Permission enforcement
│   └── admin-permission.guard.ts
├── decorators/          # Custom decorators
│   └── require-permissions.decorator.ts
└── dto/                 # Data transfer objects
    ├── tenant/
    ├── user/
    ├── role/
    └── permission/
```

## Usage

### Import the Module

```typescript
import { AdminModule } from 'admin';

@Module({
  imports: [AdminModule],
})
export class AppModule {}
```

### Using Permission Guards

```typescript
import { RequirePermissions } from 'admin';

@Controller('api/v1/admin/users')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class UserController {
  @Get()
  @RequirePermissions(['users:read:all', 'users:read:own'])
  async getUsers(@CurrentUser() user: User) {
    // Data is automatically scoped based on user permissions
    return this.userService.findAll(user);
  }
}
```

### Data Scoping Service

```typescript
import { DataScopingService } from 'admin';

@Injectable()
export class MyService {
  constructor(private scopingService: DataScopingService) {}

  async getData(currentUser: User) {
    // Automatically scope query based on permissions
    const query = this.scopingService.scopeQuery(currentUser, { where: {} }, 'users');
    return this.prisma.user.findMany(query);
  }
}
```

## Permission System

### Permission Format

Permissions follow the format: `resource:action:scope`

- **resource**: What is being accessed (users, tenants, roles, etc.)
- **action**: What operation (read, create, update, delete)
- **scope**: Access level (all, own, or none)

### Permission Scopes

- `:all` - Super admin access across all tenants
- `:own` - Tenant-scoped access (own tenant only)
- No scope - General permission (context-dependent)

### Example Permissions

```typescript
'users:read:all'; // Super admin: view all users across tenants
'users:read:own'; // Tenant admin: view users in own tenant
'users:create:all'; // Super admin: create users in any tenant
'users:create:own'; // Tenant admin: create users in own tenant
'tenants:create'; // Super admin: create new tenants
'roles:create:system'; // Super admin: create system-wide roles
'roles:create:tenant'; // Tenant admin: create tenant-specific roles
```

## Predefined Roles

### Super Admin

- **Scope**: System-wide
- **Access**: All permissions across all tenants
- **Tenant**: `null` (no specific tenant)
- **Use Case**: Platform administration

### Tenant Owner

- **Scope**: Single tenant
- **Access**: Full control within their tenant
- **Permissions**: Create/read/update/delete users, manage tenant roles
- **Use Case**: Business owner managing their salon

### Tenant Admin

- **Scope**: Single tenant
- **Access**: User and role management
- **Permissions**: Create/read/update users, view roles
- **Use Case**: Manager helping with user administration

### Tenant Manager

- **Scope**: Single tenant
- **Access**: Read-only administration
- **Permissions**: View users, roles, audit logs
- **Use Case**: Supervisor monitoring operations

## API Endpoints

All endpoints are under `/api/v1/admin`:

### Tenants

- `GET /tenants` - List tenants (scoped by permissions)
- `GET /tenants/:id` - Get tenant by ID
- `POST /tenants` - Create tenant (super admin only)
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant (super admin only)
- `POST /tenants/:id/suspend` - Suspend tenant (super admin only)

### Users

- `GET /users` - List users (scoped by permissions)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `POST /users/:id/impersonate` - Impersonate user

### Roles

- `GET /roles` - List roles (scoped by permissions)
- `GET /roles/:id` - Get role by ID
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role
- `POST /roles/:id/permissions` - Assign permissions

### Permissions

- `GET /permissions` - List all permissions
- `GET /permissions/category/:category` - Get by category
- `GET /permissions/role/:roleId` - Get role permissions
- `GET /permissions/user/:userId` - Get user permissions

## Implementation Status

**Current Status**: Structure created, ready for implementation

### Completed

- ✅ Library structure created
- ✅ Controllers with permission decorators
- ✅ Service layer with data scoping
- ✅ Permission guard implementation
- ✅ DTO definitions
- ✅ Module configuration

### TODO

- [ ] Implement service methods (business logic)
- [ ] Add database queries with Prisma
- [ ] Create permission seed data
- [ ] Add comprehensive tests
- [ ] Add audit logging
- [ ] Implement impersonation feature
- [ ] Add rate limiting for admin endpoints

## Testing

```bash
# Run tests
nx test admin

# Run tests with coverage
nx test admin --coverage
```

## Best Practices

1. **Always use permission guards** on admin endpoints
2. **Use DataScopingService** for automatic query scoping
3. **Validate tenant access** when creating/updating cross-tenant resources
4. **Audit log** all admin actions (especially impersonation)
5. **Never expose** admin endpoints without authentication
6. **Use DTO validation** for all input data

## Security Considerations

- All endpoints require JWT authentication
- Permission checks happen at both guard and service level
- Super admin (tenantId = null) bypasses tenant scoping
- Tenant admins cannot access other tenants' data
- System roles cannot be modified by tenant admins
- Impersonation requires specific permission and is audited

## Related Documentation

- [Unified Admin Implementation Plan](/docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md)
- [Permission System Design](/docs/PERMISSIONS.md) (TODO)
- [Role Management Guide](/docs/ROLES.md) (TODO)

## Support

For questions or issues, refer to the main project documentation or contact the development team.
