# Unified Admin System - Implementation Plan

## Overview

A permission-based admin system where super admins, tenant admins, and other administrative roles share the same APIs and UI components, with access controlled entirely through roles and permissions.

## Core Architecture Principle

**Single Implementation, Permission-Based Access**

Instead of separate implementations:

- ❌ `/api/v1/super-admin/users` (super admin only)
- ❌ `/api/v1/admin/users` (tenant admin only)

We build unified endpoints:

- ✅ `/api/v1/admin/users` (access based on permissions)

## Permission-Based Architecture

### Permission Hierarchy

```typescript
// Permission structure: resource:action:scope
export const ADMIN_PERMISSIONS = {
  // Tenant Management
  'tenants:create': 'Create new tenants',
  'tenants:read:all': 'View all tenants', // Super admin
  'tenants:read:own': 'View own tenant', // Tenant admin
  'tenants:update:all': 'Update any tenant',
  'tenants:update:own': 'Update own tenant',
  'tenants:delete': 'Delete tenants',
  'tenants:suspend': 'Suspend tenants',

  // User Management
  'users:create:all': 'Create users in any tenant',
  'users:create:own': 'Create users in own tenant',
  'users:read:all': 'View all users across tenants',
  'users:read:own': 'View users in own tenant',
  'users:update:all': 'Update any user',
  'users:update:own': 'Update users in own tenant',
  'users:delete:all': 'Delete any user',
  'users:delete:own': 'Delete users in own tenant',

  // Role Management
  'roles:create:system': 'Create system-wide roles',
  'roles:create:tenant': 'Create tenant-specific roles',
  'roles:read:all': 'View all roles',
  'roles:read:own': 'View tenant roles',
  'roles:update:system': 'Update system roles',
  'roles:update:tenant': 'Update tenant roles',
  'roles:delete': 'Delete roles',

  // Permission Management
  'permissions:manage': 'Manage system permissions',
  'permissions:assign': 'Assign permissions to roles',
  'permissions:read': 'View available permissions',

  // System Operations
  'system:config': 'System configuration',
  'system:maintenance': 'Maintenance mode',
  'audit:read:all': 'View all audit logs',
  'audit:read:own': 'View own tenant audit logs',
  'impersonate:any': 'Impersonate any user',
  'impersonate:own': 'Impersonate users in own tenant',
};
```

### Predefined Roles

```typescript
// System roles (seeded in database)
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access',
    type: 'system',
    tenantId: null,
    permissions: Object.keys(ADMIN_PERMISSIONS), // All permissions
  },

  TENANT_OWNER: {
    name: 'Tenant Owner',
    description: 'Full access within tenant',
    type: 'tenant',
    permissions: [
      'tenants:read:own',
      'tenants:update:own',
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'users:delete:own',
      'roles:create:tenant',
      'roles:read:own',
      'roles:update:tenant',
      'audit:read:own',
      'impersonate:own',
    ],
  },

  TENANT_ADMIN: {
    name: 'Tenant Admin',
    description: 'User and role management within tenant',
    type: 'tenant',
    permissions: [
      'users:create:own',
      'users:read:own',
      'users:update:own',
      'roles:read:own',
      'audit:read:own',
    ],
  },

  TENANT_MANAGER: {
    name: 'Tenant Manager',
    description: 'Read-only access to tenant administration',
    type: 'tenant',
    permissions: ['users:read:own', 'roles:read:own', 'audit:read:own'],
  },
};
```

## Backend Implementation

### Unified Admin Module Structure

```
libs/backend/admin/
├── controllers/
│   ├── tenant.controller.ts      # Unified tenant management
│   ├── user.controller.ts        # Unified user management
│   ├── role.controller.ts        # Unified role management
│   └── permission.controller.ts  # Permission management
├── services/
│   ├── tenant.service.ts
│   ├── user-admin.service.ts
│   ├── role.service.ts
│   └── permission.service.ts
├── guards/
│   └── admin-permission.guard.ts # Permission-based access
├── decorators/
│   ├── require-permissions.decorator.ts
│   └── data-scope.decorator.ts
├── interceptors/
│   └── data-scoping.interceptor.ts
├── dto/
│   └── [various DTOs]
└── admin.module.ts
```

### Unified API Endpoints

All endpoints check permissions and scope data accordingly:

```typescript
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
export class AdminController {
  // TENANTS
  @Get('/tenants')
  @RequirePermissions(['tenants:read:all', 'tenants:read:own'])
  async getTenants(@CurrentUser() user: User) {
    // Service automatically scopes based on permissions
    return this.tenantService.findAll(user);
  }

  @Post('/tenants')
  @RequirePermissions(['tenants:create'])
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  // USERS
  @Get('/users')
  @RequirePermissions(['users:read:all', 'users:read:own'])
  async getUsers(@CurrentUser() user: User, @Query() filters: UserFilterDto) {
    return this.userService.findAll(user, filters);
  }

  @Post('/users')
  @RequirePermissions(['users:create:all', 'users:create:own'])
  async createUser(@CurrentUser() user: User, @Body() dto: CreateUserDto) {
    return this.userService.create(user, dto);
  }

  // ROLES
  @Get('/roles')
  @RequirePermissions(['roles:read:all', 'roles:read:own'])
  async getRoles(@CurrentUser() user: User) {
    return this.roleService.findAll(user);
  }

  @Post('/roles')
  @RequirePermissions(['roles:create:system', 'roles:create:tenant'])
  async createRole(@CurrentUser() user: User, @Body() dto: CreateRoleDto) {
    return this.roleService.create(user, dto);
  }
}
```

### Permission Guard Implementation

```typescript
@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      return false;
    }

    // Check if user has ANY of the required permissions (OR logic)
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

### Data Scoping Service

```typescript
@Injectable()
export class DataScopingService {
  scopeQuery(user: User, query: any, resource: string): any {
    // If user has "all" permission, no scoping needed
    if (user.permissions.includes(`${resource}:read:all`)) {
      return query; // Return unmodified query
    }

    // If user has "own" permission, add tenant filter
    if (user.permissions.includes(`${resource}:read:own`)) {
      return {
        ...query,
        where: {
          ...query.where,
          tenantId: user.tenantId,
        },
      };
    }

    // No read permissions
    throw new ForbiddenException('Insufficient permissions');
  }

  canAccessEntity(user: User, entity: any, permission: string): boolean {
    // Super admin can access everything
    if (user.tenantId === null) {
      return true;
    }

    // Check if permission allows cross-tenant access
    if (permission.endsWith(':all')) {
      return user.permissions.includes(permission);
    }

    // Check if permission is for own tenant only
    if (permission.endsWith(':own')) {
      return user.permissions.includes(permission) && entity.tenantId === user.tenantId;
    }

    return false;
  }
}
```

### Service Layer Example

```typescript
@Injectable()
export class UserAdminService {
  constructor(
    private prisma: PrismaService,
    private scopingService: DataScopingService,
  ) {}

  async findAll(currentUser: User, filters: UserFilterDto) {
    // Build base query
    let query = {
      where: filters.where || {},
      include: { role: true, tenant: true },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    };

    // Apply data scoping based on permissions
    query = this.scopingService.scopeQuery(currentUser, query, 'users');

    return this.prisma.user.findMany(query);
  }

  async create(currentUser: User, dto: CreateUserDto) {
    // Validate tenant access
    if (dto.tenantId && dto.tenantId !== currentUser.tenantId) {
      // User trying to create in different tenant
      if (!currentUser.permissions.includes('users:create:all')) {
        throw new ForbiddenException('Cannot create users in other tenants');
      }
    }

    // Set tenantId if not provided (for tenant admins)
    const tenantId = dto.tenantId || currentUser.tenantId;

    return this.prisma.user.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async update(currentUser: User, userId: string, dto: UpdateUserDto) {
    // Get the user to check tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if current user can update this user
    const canUpdate =
      this.scopingService.canAccessEntity(currentUser, user, 'users:update:all') ||
      this.scopingService.canAccessEntity(currentUser, user, 'users:update:own');

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

## Frontend Implementation

### Shared Component Architecture

```
libs/frontend/admin/
├── feature-admin-shell/
│   ├── AdminLayout.tsx           # Main admin layout
│   ├── AdminNavigation.tsx       # Permission-aware navigation
│   └── AdminDashboard.tsx        # Role-based dashboard
├── feature-tenant-management/
│   ├── TenantList.tsx            # Shows all or own based on permissions
│   ├── TenantForm.tsx            # Enable/disable based on permissions
│   └── TenantDetails.tsx
├── feature-user-management/
│   ├── UserList.tsx              # Filtered by permissions
│   ├── UserForm.tsx              # Tenant selector if permitted
│   └── UserDetails.tsx
├── feature-role-management/
│   ├── RoleList.tsx              # System/tenant roles based on permissions
│   ├── RoleForm.tsx
│   └── PermissionMatrix.tsx
├── ui-components/
│   ├── PermissionGate.tsx       # Conditional rendering
│   ├── DataTable.tsx             # Reusable data table
│   └── ActionMenu.tsx            # Permission-aware actions
└── hooks/
    ├── usePermissions.ts         # Permission checking
    ├── useAdminData.ts           # Data fetching with scoping
    └── useCanAccess.ts           # Access control helper
```

### Permission-Aware Components

#### PermissionGate Component

```tsx
export const PermissionGate: React.FC<{
  permissions: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permissions, fallback = null, children }) => {
  const { hasPermission } = usePermissions();

  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  // Check if user has ANY of the required permissions
  const canAccess = requiredPermissions.some((p) => hasPermission(p));

  return canAccess ? <>{children}</> : <>{fallback}</>;
};
```

#### Permission Hook

```tsx
export const usePermissions = () => {
  const user = useCurrentUser();

  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions?.includes(permission) || false;
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const canAccessResource = useCallback(
    (resource: string, action: string) => {
      // Check both :all and :own variants
      return hasAnyPermission([`${resource}:${action}:all`, `${resource}:${action}:own`]);
    },
    [hasAnyPermission],
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessResource,
    permissions: user?.permissions || [],
  };
};
```

#### Admin Navigation

```tsx
export const AdminNavigation: React.FC = () => {
  const { canAccessResource } = usePermissions();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/app/admin',
      icon: LayoutDashboard,
      show: true, // Always show
    },
    {
      label: 'Tenants',
      path: '/app/admin/tenants',
      icon: Building,
      show: canAccessResource('tenants', 'read'),
    },
    {
      label: 'Users',
      path: '/app/admin/users',
      icon: Users,
      show: canAccessResource('users', 'read'),
    },
    {
      label: 'Roles',
      path: '/app/admin/roles',
      icon: Shield,
      show: canAccessResource('roles', 'read'),
    },
    {
      label: 'Permissions',
      path: '/app/admin/permissions',
      icon: Key,
      show: canAccessResource('permissions', 'read'),
    },
    {
      label: 'Audit Logs',
      path: '/app/admin/audit',
      icon: FileText,
      show: canAccessResource('audit', 'read'),
    },
  ];

  return (
    <nav>
      {navItems
        .filter((item) => item.show)
        .map((item) => (
          <NavLink key={item.path} to={item.path}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
    </nav>
  );
};
```

#### Shared User Management Component

```tsx
export const UserManagement: React.FC = () => {
  const { hasPermission, canAccessResource } = usePermissions();
  const currentUser = useCurrentUser();

  // Fetch users - API automatically scopes based on permissions
  const { data: users, loading } = useUsers();

  const canCreateUser = canAccessResource('users', 'create');
  const canUpdateUser = canAccessResource('users', 'update');
  const canDeleteUser = canAccessResource('users', 'delete');
  const canSelectTenant = hasPermission('users:create:all');

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>User Management</h1>
        <PermissionGate permissions={['users:create:all', 'users:create:own']}>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        data={users}
        columns={[
          { key: 'email', label: 'Email' },
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'role.name', label: 'Role' },
          // Show tenant column only if user can see multiple tenants
          ...(hasPermission('users:read:all') ? [{ key: 'tenant.name', label: 'Tenant' }] : []),
          {
            key: 'actions',
            label: 'Actions',
            render: (user) => (
              <ActionMenu>
                <PermissionGate permissions={['users:update:all', 'users:update:own']}>
                  <ActionMenuItem onClick={() => handleEdit(user)}>Edit</ActionMenuItem>
                </PermissionGate>
                <PermissionGate permissions={['users:delete:all', 'users:delete:own']}>
                  <ActionMenuItem onClick={() => handleDelete(user)}>Delete</ActionMenuItem>
                </PermissionGate>
                <PermissionGate permissions={['impersonate:any', 'impersonate:own']}>
                  <ActionMenuItem onClick={() => handleImpersonate(user)}>Login As</ActionMenuItem>
                </PermissionGate>
              </ActionMenu>
            ),
          },
        ]}
      />

      {/* User creation dialog */}
      <UserFormDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        showTenantSelector={canSelectTenant}
        defaultTenantId={currentUser?.tenantId}
      />
    </div>
  );
};
```

### Data Fetching with Automatic Scoping

```tsx
export const useUsers = (filters?: UserFilters) => {
  const { data, error, loading } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminApi.getUsers(filters),
    // API automatically returns scoped data based on user's permissions
  });

  return { data, error, loading };
};

export const useTenants = () => {
  const { hasPermission } = usePermissions();
  const currentUser = useCurrentUser();

  const { data, error, loading } = useQuery({
    queryKey: ['admin', 'tenants'],
    queryFn: () => adminApi.getTenants(),
    // Only fetch if user has permission
    enabled: hasPermission('tenants:read:all') || hasPermission('tenants:read:own'),
  });

  // For users with "own" permission, data will only contain their tenant
  // For users with "all" permission, data contains all tenants
  return { data, error, loading };
};
```

## Database Seeds

### Permission and Role Seeds

```typescript
// prisma/seeds/admin-permissions.seed.ts
export async function seedAdminPermissions(prisma: PrismaClient) {
  // Create all permissions
  const permissions = Object.entries(ADMIN_PERMISSIONS).map(([name, description]) => ({
    name,
    description,
    resource: name.split(':')[0],
    action: name.split(':').slice(1).join(':'),
    category: 'admin',
    isSystem: true,
  }));

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true,
  });

  // Create system roles
  await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access',
      type: 'system',
      level: 100,
      permissions: Object.keys(ADMIN_PERMISSIONS),
      isSystem: true,
      isDefault: false,
    },
  });

  await prisma.role.create({
    data: {
      name: 'Tenant Owner',
      description: 'Full access within tenant',
      type: 'tenant',
      level: 90,
      permissions: SYSTEM_ROLES.TENANT_OWNER.permissions,
      isSystem: true,
      isDefault: false,
    },
  });

  await prisma.role.create({
    data: {
      name: 'Tenant Admin',
      description: 'User and role management within tenant',
      type: 'tenant',
      level: 80,
      permissions: SYSTEM_ROLES.TENANT_ADMIN.permissions,
      isSystem: true,
      isDefault: false,
    },
  });
}
```

### Creating Initial Super Admin

```typescript
// prisma/seeds/super-admin.seed.ts
export async function createSuperAdmin(prisma: PrismaClient) {
  const superAdminRole = await prisma.role.findFirst({
    where: { name: 'Super Admin' },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found. Run permission seeds first.');
  }

  const hashedPassword = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'ChangeMeNow!', 12);

  await prisma.user.create({
    data: {
      email: 'super@ftry.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      tenantId: null, // NULL indicates super admin
      roleId: superAdminRole.id,
      emailVerified: true,
      status: 'active',
      isSuperAdmin: true,
    },
  });
}
```

## Testing Strategy

### Permission Testing

```typescript
describe('Admin API Permissions', () => {
  describe('GET /api/v1/admin/users', () => {
    it('should return all users for super admin', async () => {
      const superAdmin = await createUser({
        tenantId: null,
        permissions: ['users:read:all'],
      });

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdmin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(totalUsers);
    });

    it('should return only tenant users for tenant admin', async () => {
      const tenantAdmin = await createUser({
        tenantId: 'tenant-1',
        permissions: ['users:read:own'],
      });

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${tenantAdmin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((u) => u.tenantId === 'tenant-1')).toBe(true);
    });

    it('should return 403 for users without permission', async () => {
      const regularUser = await createUser({
        tenantId: 'tenant-1',
        permissions: [],
      });

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${regularUser.token}`);

      expect(response.status).toBe(403);
    });
  });
});
```

## Migration Path

### Phase 1: Foundation (Week 1)

- [ ] Create unified admin module
- [ ] Implement permission guard
- [ ] Add data scoping service
- [ ] Create permission decorators
- [ ] Seed permissions and roles

### Phase 2: Core APIs (Week 2)

- [ ] Implement tenant controller with permissions
- [ ] Implement user controller with permissions
- [ ] Implement role controller with permissions
- [ ] Add audit logging for all actions
- [ ] Write API tests

### Phase 3: Frontend Components (Week 3)

- [ ] Create PermissionGate component
- [ ] Implement usePermissions hook
- [ ] Build admin navigation with permissions
- [ ] Create shared DataTable component
- [ ] Add permission-aware action menus

### Phase 4: Feature Implementation (Week 4)

- [ ] Complete user management UI
- [ ] Complete tenant management UI
- [ ] Complete role management UI
- [ ] Add permission matrix component
- [ ] Implement audit log viewer

### Phase 5: Testing & Polish (Week 5)

- [ ] Comprehensive permission testing
- [ ] E2E tests for all admin flows
- [ ] Performance optimization
- [ ] Documentation
- [ ] Security audit

## Benefits of This Approach

1. **Single Source of Truth**: One set of APIs and components
2. **Maintainability**: No duplicate code between admin levels
3. **Flexibility**: Easy to add new permission levels
4. **Scalability**: Can add new resources without duplicating code
5. **Consistency**: Same UX for all admin types
6. **Security**: Centralized permission checking
7. **Testing**: Test permissions once, works everywhere
8. **Future-Proof**: Easy to add new admin roles

## Example: Adding a New Resource

To add billing management:

1. **Add Permissions**:

```typescript
'billing:create': 'Create invoices',
'billing:read:all': 'View all invoices',
'billing:read:own': 'View tenant invoices',
'billing:update:all': 'Update any invoice',
'billing:update:own': 'Update tenant invoices',
```

2. **Add Controller**:

```typescript
@Get('/billing')
@RequirePermissions(['billing:read:all', 'billing:read:own'])
async getBilling(@CurrentUser() user: User) {
  return this.billingService.findAll(user);
}
```

3. **Add UI Route**:

```tsx
{
  label: 'Billing',
  path: '/app/admin/billing',
  show: canAccessResource('billing', 'read'),
}
```

That's it! The permission system automatically handles access control.

---

**Created**: 2025-10-10
**Status**: Architecture Defined - Ready for Implementation
**Approach**: Unified Permission-Based Admin System
