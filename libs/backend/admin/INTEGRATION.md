# Admin Module Integration Guide

## Overview

The Admin module has been successfully integrated into the main backend application. This document provides details about the integration and how to use the admin endpoints.

## Integration Changes

### 1. AppModule Configuration

**File**: `apps/backend/src/app/app.module.ts`

The AdminModule has been added to the AppModule imports:

```typescript
import { AdminModule } from 'admin';

@Module({
  imports: [
    // ... other modules
    PrismaModule,
    AuthModule,
    // Admin module - MUST come after PrismaModule and AuthModule
    AdminModule,
  ],
  // ...
})
export class AppModule {}
```

**Important**: AdminModule MUST be imported after:

- `PrismaModule` - Required for database access
- `AuthModule` - Required for JWT guards and CurrentUser decorator

### 2. Controller Routes

All admin controllers use versioned routes with the global prefix:

- **TenantController**: `/api/v1/admin/tenants`
- **UserController**: `/api/v1/admin/users`
- **RoleController**: `/api/v1/admin/roles`
- **PermissionController**: `/api/v1/admin/permissions`

The controllers are configured with `@Controller('v1/admin/...')` which combines with the global prefix `api` (set in `bootstrap.ts`).

### 3. Swagger Documentation

Admin endpoints are documented in Swagger with dedicated tags:

- `Admin - Tenants`
- `Admin - Users`
- `Admin - Roles`
- `Admin - Permissions`

Access the documentation at: `http://localhost:3001/api/docs`

### 4. CORS Configuration

The existing CORS configuration in `bootstrap.ts` already allows admin endpoints:

```typescript
app.enableCors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size', 'X-CSRF-Token'],
});
```

## Available Endpoints

### Tenant Management

```
GET    /api/v1/admin/tenants           - List all tenants (scoped by permissions)
GET    /api/v1/admin/tenants/:id       - Get tenant by ID
POST   /api/v1/admin/tenants           - Create new tenant (super admin only)
PATCH  /api/v1/admin/tenants/:id       - Update tenant
DELETE /api/v1/admin/tenants/:id       - Delete tenant (super admin only)
POST   /api/v1/admin/tenants/:id/suspend   - Suspend tenant
POST   /api/v1/admin/tenants/:id/activate  - Activate tenant
```

### User Management

```
GET    /api/v1/admin/users             - List all users (scoped by permissions)
GET    /api/v1/admin/users/:id         - Get user by ID
POST   /api/v1/admin/users             - Create new user
PATCH  /api/v1/admin/users/:id         - Update user
DELETE /api/v1/admin/users/:id         - Delete user (soft delete)
POST   /api/v1/admin/users/:id/impersonate - Impersonate user
```

### Role Management

```
GET    /api/v1/admin/roles             - List all roles (scoped by permissions)
GET    /api/v1/admin/roles/:id         - Get role by ID
POST   /api/v1/admin/roles             - Create new role
PATCH  /api/v1/admin/roles/:id         - Update role
DELETE /api/v1/admin/roles/:id         - Delete role
POST   /api/v1/admin/roles/:id/permissions - Assign permissions to role
```

### Permission Management

```
GET    /api/v1/admin/permissions                - List all available permissions
GET    /api/v1/admin/permissions/category/:category - Get permissions by category
GET    /api/v1/admin/permissions/role/:roleId   - Get role permissions
GET    /api/v1/admin/permissions/user/:userId   - Get user permissions
```

## Authentication & Authorization

### Required Authentication

All admin endpoints require JWT authentication via the `JwtAuthGuard`:

```typescript
@UseGuards(JwtAuthGuard, AdminPermissionGuard)
```

**How to authenticate**:

1. Login via `/api/v1/auth/login` to get access token
2. Include token in `Authorization: Bearer <token>` header
3. OR token will be sent via HTTP-only cookie (automatic)

### Permission-Based Access Control

Each endpoint is protected by the `@RequirePermissions` decorator:

```typescript
@RequirePermissions(['tenants:read:all', 'tenants:read:own'])
```

**Permission Logic**:

- Multiple permissions = OR logic (user needs ANY of the listed permissions)
- Empty array = No permission check (only authentication required)

### Permission Naming Convention

Permissions follow the pattern: `resource:action:scope`

**Examples**:

- `tenants:read:all` - Read all tenants (super admin)
- `tenants:read:own` - Read own tenant (tenant owner)
- `users:create:all` - Create users in any tenant (super admin)
- `users:create:own` - Create users in own tenant (tenant admin)

### User Types & Default Permissions

1. **Super Admin** (`tenantId = null`)
   - Full system access
   - Can manage all tenants, users, roles
   - Permissions: `*:*:all`

2. **Tenant Owner** (role with `isDefault = true`)
   - Full access within their tenant
   - Can manage users and roles in their tenant
   - Permissions: `*:*:own`, `tenants:read:own`, `tenants:update:own`

3. **Tenant Admin**
   - User/role management within tenant
   - Permissions: `users:*:own`, `roles:read:own`

4. **Tenant Manager**
   - Read-only access within tenant
   - Permissions: `*:read:own`

## Data Scoping & Row-Level Security

### Automatic Tenant Isolation

The `JwtStrategy` automatically sets the tenant context for every authenticated request:

```typescript
async validate(payload: JwtPayload) {
  // CRITICAL: Set RLS tenant context
  await this.prisma.setTenantContext(payload.tenantId);

  // All subsequent queries are now tenant-scoped
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
  return user;
}
```

### DataScopingService

The `DataScopingService` provides additional permission-based filtering:

**Super Admin**:

- Can access data across ALL tenants
- No automatic filtering applied

**Tenant-scoped Users**:

- Can only access data within their tenant
- Additional permission checks apply (`:all` vs `:own`)

**Example**:

```typescript
// Super admin with 'users:read:all' → sees all users across all tenants
// Tenant admin with 'users:read:own' → sees only users in their tenant
```

## Environment Variables

Required environment variables (already configured):

```bash
# Authentication
JWT_SECRET=your-super-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://...

# CSRF Protection
CSRF_SECRET=your-csrf-secret

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

## Testing the Integration

### 1. Start the Backend

```bash
nx serve backend
```

Expected output:

```
🚀 Application is running on: http://localhost:3001/api
📚 API Documentation available at: http://localhost:3001/api/docs
📊 Metrics endpoint available at: http://localhost:3001/api/metrics
🔧 Environment: development
```

### 2. Check Swagger Documentation

Open `http://localhost:3001/api/docs` and verify:

- Admin tags are visible
- Admin endpoints are listed
- All endpoints show permission requirements

### 3. Test an Endpoint

```bash
# 1. Login to get access token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "YourPassword123!"}'

# 2. Use token to access admin endpoint
curl -X GET http://localhost:3001/api/v1/admin/tenants \
  -H "Authorization: Bearer <your-access-token>"
```

### 4. Run Integration Tests

```bash
# Run backend tests
nx test backend

# Run specific test
nx test backend --testPathPattern=admin-module-integration
```

## TypeScript Configuration

### Fixed Issues

1. **Controller Route Prefix**: Changed from `api/v1/admin/...` to `v1/admin/...` to work with global prefix
2. **DTO Properties**: Added `!` assertion to required properties with class-validator decorators
3. **Permission Service**: Added null coalescing for `parts[0]` to handle edge cases
4. **Test Exclusion**: Updated `tsconfig.app.json` to exclude `*.spec.ts` files

### Type Safety

All types are properly exported from the admin module index:

```typescript
// Module
export * from './lib/admin.module';

// Controllers
export * from './lib/controllers/tenant.controller';
export * from './lib/controllers/user.controller';
// ... etc

// Services
export * from './lib/services/tenant.service';
// ... etc

// Guards
export * from './lib/guards/admin-permission.guard';

// Decorators
export * from './lib/decorators/require-permissions.decorator';

// DTOs
export * from './lib/dto/tenant';
// ... etc
```

## Common Issues & Solutions

### Issue: 404 Not Found on Admin Endpoints

**Cause**: AdminModule not imported in AppModule

**Solution**: Verify AdminModule is in the imports array of AppModule

### Issue: 403 Forbidden

**Cause**: User doesn't have required permissions

**Solution**:

1. Check user's role permissions in database
2. Verify permission string matches decorator requirement
3. Check if user has `additionalPermissions` array

### Issue: Routes show as `/api/api/v1/admin/...`

**Cause**: Controller has full path including global prefix

**Solution**: Controllers should use `v1/admin/...` not `api/v1/admin/...`

### Issue: TypeScript Errors on DTOs

**Cause**: Strict mode requires initialization of class properties

**Solution**: Add `!` to required properties with validators:

```typescript
@IsString()
name!: string; // ✅ Correct
```

## Next Steps

### 1. Seed Permissions

Run the seed script to populate permissions:

```bash
bunx prisma db seed
```

This will create:

- System-wide roles (Super Admin, Tenant Owner, Tenant Admin, Tenant Manager)
- Default permissions for each role
- Example tenants and users

### 2. Create Super Admin User

Use the registration endpoint with appropriate permissions to create the first super admin.

### 3. Frontend Integration

The frontend admin module is ready at `libs/frontend/feature-admin`. See its documentation for integration details.

## Security Considerations

### 1. Always Use Guards

Never expose admin endpoints without guards:

```typescript
@UseGuards(JwtAuthGuard, AdminPermissionGuard) // ✅ Required
```

### 2. Validate Permissions

Always use `@RequirePermissions` decorator:

```typescript
@RequirePermissions(['tenants:create']) // ✅ Required
```

### 3. Row-Level Security

RLS is ACTIVE - tenant isolation is enforced at database level:

- Users cannot query data from other tenants
- Super admins (null tenantId) can access all data
- Context is set automatically on every authenticated request

### 4. Input Validation

All DTOs use class-validator:

- Prevents injection attacks
- Ensures data integrity
- Provides clear error messages

## Monitoring & Observability

Admin operations are automatically tracked:

### 1. Metrics (Prometheus)

All HTTP requests are tracked via `MetricsInterceptor`:

- Request duration
- Status codes
- Endpoint paths

Access metrics: `http://localhost:3001/api/metrics`

### 2. Logging (Pino)

All operations are logged with structured data:

```typescript
this.logger.log({
  msg: 'Tenant created',
  tenantId: tenant.id,
  createdBy: user.id,
});
```

### 3. Distributed Tracing (OpenTelemetry)

Requests are traced across services for debugging.

---

## Support

For questions or issues:

1. Check this integration guide
2. Review module-specific CLAUDE.md files
3. Check Swagger documentation
4. Review test files for examples

**Last Updated**: 2025-10-10
**Status**: ✅ Integrated and Ready for Use
