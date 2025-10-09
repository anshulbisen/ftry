# Database Seed Modules

This directory contains modular seed files for the ftry database. Seeds are organized by functional area for maintainability and reusability.

## Seed Files

### Admin System Seeds

#### 1. `admin-permissions.seed.ts`

Creates all administrative permissions for the unified admin system.

**Permissions Created**: 31 admin permissions

- Tenant management: `tenants:*`
- User management: `users:*`
- Role management: `roles:*`
- Permission management: `permissions:*`
- System operations: `system:*`, `audit:*`, `impersonate:*`

**Features**:

- Idempotent (uses `createMany` with `skipDuplicates`)
- Follows resource:action:scope naming convention
- All permissions marked as system permissions (`isSystem: true`)

**Usage**:

```typescript
import { seedAdminPermissions } from './seeds/admin-permissions.seed';
await seedAdminPermissions(prisma);
```

---

#### 2. `admin-roles.seed.ts`

Creates predefined system roles for the unified admin system.

**Roles Created**: 4 admin roles

1. **Super Admin** (level 100) - All 31 permissions
2. **Tenant Owner** (level 90) - 12 permissions (full tenant access)
3. **Tenant Admin** (level 80) - 6 permissions (user management)
4. **Tenant Manager** (level 70) - 4 permissions (read-only)

**Features**:

- Idempotent (checks for existing roles, updates if found)
- Role hierarchy enforced via `level` field
- All roles marked as system roles (`isSystem: true`)
- NULL `tenantId` for system-wide roles

**Usage**:

```typescript
import { seedAdminRoles } from './seeds/admin-roles.seed';
await seedAdminRoles(prisma);
```

---

#### 3. `super-admin-user.seed.ts`

Creates the initial super admin user account.

**User Created**: 1 super admin user

- Email: `super@ftry.com` (or `SUPER_ADMIN_EMAIL` env var)
- Password: Configured via environment variable
- Role: Super Admin
- Tenant: NULL (cross-tenant access)

**Features**:

- Idempotent (checks if user exists, skips if found)
- Password must be set via `SUPER_ADMIN_PASSWORD` environment variable in production
- Throws error in production if default password is used
- Pre-verified email for immediate access

**Environment Variables**:

- `SUPER_ADMIN_EMAIL` - Super admin email (default: super@ftry.com)
- `SUPER_ADMIN_PASSWORD` - Super admin password (REQUIRED in production)

**Usage**:

```typescript
import { seedSuperAdminUser } from './seeds/super-admin-user.seed';
await seedSuperAdminUser(prisma);
```

**Security**:

```bash
# Production deployment
export SUPER_ADMIN_PASSWORD="YourSecurePasswordHere123!@#"
bunx prisma db seed
```

## Execution Order

Seeds must be executed in this order due to dependencies:

1. **Permissions** - Required before roles
2. **Roles** - Required before users
3. **Super Admin User** - Depends on Super Admin role

The main `seed.ts` file handles this automatically:

```typescript
// In prisma/seed.ts
async function main() {
  // 1. Admin permissions
  await seedAdminPermissions(prisma);

  // 2. Admin roles
  await seedAdminRoles(prisma);

  // 3. Super admin user
  await seedSuperAdminUser(prisma);

  // 4. Tenant-scoped data (existing seeds)
  // ...
}
```

## Running Seeds

### Full Seed (Development)

```bash
NODE_ENV=development bunx prisma db seed
```

This will:

1. Clear all existing data (development only)
2. Create admin permissions, roles, and super admin
3. Create tenant-scoped permissions and roles
4. Create demo tenants and users

### Production Seed

```bash
NODE_ENV=production SUPER_ADMIN_PASSWORD="SecurePass123!" bunx prisma db seed
```

Production seeds are more conservative:

- No data clearing
- Only creates missing records (idempotent)
- Requires `SUPER_ADMIN_PASSWORD` environment variable

## Verification

After seeding, verify using the included verification tools:

### Automated Verification Script

```bash
# Create and run verification script
cat > verify-seeds.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying database seeds...\n');

  const permissionCount = await prisma.permission.count();
  const roleCount = await prisma.role.count({ where: { isSystem: true, tenantId: null } });
  const superAdminCount = await prisma.user.count({ where: { tenantId: null } });
  const tenantCount = await prisma.tenant.count();

  console.log('📊 Results:');
  console.log('   Permissions:', permissionCount);
  console.log('   System Roles:', roleCount);
  console.log('   Super Admins:', superAdminCount);
  console.log('   Tenants:', tenantCount);
  console.log('\n✅ Verification complete!');
}

verify().catch(console.error).finally(() => prisma.$disconnect());
EOF
bun run verify-seeds.ts
```

### SQL Verification Queries

See `prisma/seeds/VERIFICATION_QUERIES.sql` for comprehensive SQL queries including:

- Permission counts by category
- Role permission mappings
- Super admin verification
- Tenant and user listings
- Health check overview

### Manual Verification

```bash
# Start Prisma Studio
bunx prisma studio

# Or query directly
psql $DATABASE_URL -c "SELECT name, level, array_length(permissions, 1) FROM \"Role\" WHERE name LIKE '%Admin%';"
```

### Expected Results

**Permissions**:

```
admin_permissions: 31
```

**Roles**:

```
| name           | level | permissions |
|----------------|-------|-------------|
| Super Admin    | 100   | 31          |
| Tenant Owner   | 90    | 12          |
| Tenant Admin   | 80    | 6           |
| Tenant Manager | 70    | 4           |
```

**Super Admin User**:

```
email: super@ftry.com
tenantId: NULL
emailVerified: true
```

## Adding New Seeds

To add a new seed module:

1. Create seed file in `prisma/seeds/[name].seed.ts`
2. Export a seed function:
   ```typescript
   export async function seedMyFeature(prisma: PrismaClient) {
     // Your seed logic
   }
   ```
3. Import and call in `prisma/seed.ts`:
   ```typescript
   import { seedMyFeature } from './seeds/my-feature.seed';
   await seedMyFeature(prisma);
   ```
4. Ensure idempotency (use `upsert`, `createMany` with `skipDuplicates`, or check before insert)

## Troubleshooting

### "Super Admin role not found"

**Cause**: Admin roles seed failed or ran in wrong order
**Fix**: Ensure `seedAdminRoles()` runs before `seedSuperAdminUser()`

### "SECURITY ERROR: SUPER_ADMIN_PASSWORD must be set"

**Cause**: Production deployment without password
**Fix**: Set `SUPER_ADMIN_PASSWORD` environment variable

### Duplicate key errors

**Cause**: Seeds not idempotent or data already exists
**Fix**: Use `skipDuplicates`, `upsert`, or check existence before creation

### Permission count mismatch

**Cause**: ADMIN_PERMISSIONS object was updated but seed didn't run
**Fix**: Re-run seed with `bunx prisma db seed`

## Related Documentation

### Seed Documentation

- **Seed Results**: `prisma/seeds/SEED_RESULTS.md` - Detailed results of latest seed execution
- **Verification Queries**: `prisma/seeds/VERIFICATION_QUERIES.sql` - SQL queries to verify seed data
- **This README**: `prisma/seeds/README.md` - Seed module documentation

### System Documentation

- **Implementation Plan**: `/docs/UNIFIED_ADMIN_IMPLEMENTATION_PLAN.md`
- **Database Schema**: `/prisma/CLAUDE.md`
- **Authentication**: `/libs/backend/auth/CLAUDE.md`

---

**Last Updated**: 2025-10-10
**Admin Permissions**: 31
**Admin Roles**: 4
**Status**: ✅ Seeds verified and working
