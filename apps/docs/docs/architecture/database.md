# Database Architecture

ftry uses PostgreSQL 18 with Prisma 6 ORM, implementing Row-Level Security (RLS) for automatic multi-tenant isolation.

## Overview

**Database**: PostgreSQL 18
**ORM**: Prisma 6.16.3
**Security**: Row-Level Security (RLS) - ACTIVE
**Health Score**: 78/100 (Good)

## Schema Overview

```
┌──────────────────────────────────────────────────────┐
│                     Tenant                            │
│  id, name, slug, subscriptionPlan, status            │
└────┬─────────────────────────────────────────────────┘
     │
     ├─────> User (tenantId FK)
     ├─────> Role (tenantId FK)
     └─────> AuditLog (tenantId FK)

┌──────────────────────────────────────────────────────┐
│                      User                             │
│  id, email, password, tenantId, roleId, status       │
└────┬─────────────────────────────────────────────────┘
     │
     ├─────> RefreshToken (userId FK)
     ├─────> Session (userId FK)
     └─────> AuditLog (userId FK)

┌──────────────────────────────────────────────────────┐
│                      Role                             │
│  id, name, permissions[], tenantId, type             │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                   Permission                          │
│  id, name, resource, action, category                │
└──────────────────────────────────────────────────────┘
```

## Multi-Tenant Pattern

### Tenant Model

```prisma
model Tenant {
  id                 String     @id @default(cuid())
  name               String     @db.VarChar(255)
  slug               String     @unique @db.VarChar(100)
  description        String?
  subscriptionPlan   String     @default("free") @db.VarChar(50)
  subscriptionStatus String     @default("active") @db.VarChar(50)
  status             String     @default("active") @db.VarChar(50)
  createdAt          DateTime   @default(now()) @db.Timestamptz(6)
  updatedAt          DateTime   @updatedAt @db.Timestamptz(6)

  // Relations
  users              User[]
  roles              Role[]
  auditLogs          AuditLog[]

  @@index([slug])
  @@index([status])
}
```

**Key Fields**:

- `slug`: URL-friendly unique identifier (e.g., "salon-xyz")
- `subscriptionPlan`: "free", "basic", "premium"
- `subscriptionStatus`: "active", "suspended", "cancelled"

### User Model with Tenant Isolation

```prisma
model User {
  id                     String          @id @default(cuid())
  email                  String          @unique @db.VarChar(255)
  password               String          @db.VarChar(255)
  firstName              String          @db.VarChar(100)
  lastName               String          @db.VarChar(100)
  phone                  String?         @db.VarChar(20)
  tenantId               String?         // NULL for super admins
  roleId                 String
  status                 String          @default("active") @db.VarChar(50)
  isDeleted              Boolean         @default(false)
  deletedAt              DateTime?       @db.Timestamptz(6)

  // Security fields
  emailVerified          Boolean         @default(false)
  emailVerificationToken String?         @db.VarChar(255)
  passwordResetToken     String?         @db.VarChar(255)
  passwordResetExpiry    DateTime?       @db.Timestamptz(6)
  lastLogin              DateTime?       @db.Timestamptz(6)
  loginAttempts          Int             @default(0) @db.SmallInt
  lockedUntil            DateTime?       @db.Timestamptz(6)
  additionalPermissions  String[]        @default([])

  // Audit fields
  metadata               Json?
  createdBy              String?
  createdAt              DateTime        @default(now()) @db.Timestamptz(6)
  updatedAt              DateTime        @updatedAt @db.Timestamptz(6)

  // Relations
  role                   Role            @relation(fields: [roleId], references: [id])
  tenant                 Tenant?         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  refreshTokens          RefreshToken[]
  sessions               Session[]
  auditLogs              AuditLog[]
  creator                User?           @relation("UserCreator", fields: [createdBy], references: [id])
  createdUsers           User[]          @relation("UserCreator")

  // CRITICAL: Email unique per tenant (same email across tenants OK)
  @@unique([email, tenantId])
  @@index([tenantId])           // Performance: Filter by tenant
  @@index([roleId])             // Performance: Join with roles
  @@index([email])              // Performance: Login lookup
  @@index([status])             // Performance: Active user filtering
  @@index([tenantId, status])   // Composite: Tenant + status
  @@index([tenantId, roleId])   // Composite: Tenant + role
  @@index([email, status])      // Composite: Email + status
}
```

**Key Design Decisions**:

- `tenantId` is **nullable**: NULL = super admin (access all tenants)
- `@@unique([email, tenantId])`: Same email allowed across tenants
- Soft delete: `isDeleted + deletedAt` instead of hard delete
- Cascade delete: If tenant deleted, all users deleted

## Row-Level Security (RLS)

**Status**: ✅ ACTIVE - Automatic tenant isolation

### How RLS Works

RLS uses PostgreSQL policies to automatically filter queries by tenant context:

```sql
-- RLS policy on User table
CREATE POLICY user_tenant_isolation ON "User"
  USING (
    -- Super admin (NULL tenant) sees all
    current_setting('app.current_tenant_id', true) IS NULL
    OR
    -- Regular users see only their tenant
    "tenantId" = current_setting('app.current_tenant_id', true)
  );

-- Enable RLS on table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
```

### Automatic Context Setting

Every authenticated request sets tenant context via JWT strategy:

```typescript
// jwt.strategy.ts
async validate(payload: JwtPayload): Promise<UserWithPermissions> {
  // CRITICAL: Set RLS context BEFORE any queries
  await this.prisma.setTenantContext(payload.tenantId);

  // All subsequent queries are now tenant-scoped
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub },
  });
  // Returns ONLY current tenant's users (RLS enforced)

  return user;
}
```

### PrismaService RLS Implementation

```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async setTenantContext(tenantId: string | null): Promise<void> {
    if (tenantId === null) {
      // Super admin: clear context (see all tenants)
      await this.$executeRaw`SELECT set_tenant_context(NULL)`;
      this.logger.log('RLS tenant context cleared (super admin access)');
    } else {
      // Set tenant context for regular users
      await this.$executeRaw`SELECT set_tenant_context(${tenantId})`;
      this.logger.log(`RLS tenant context set: tenantId=${tenantId}`);
    }
  }

  async getTenantContext(): Promise<string | null> {
    const result = await this.$queryRaw<[{ current_setting: string }]>`
      SELECT current_setting('app.current_tenant_id', true) AS current_setting
    `;
    return result[0]?.current_setting || null;
  }
}
```

### Benefits of RLS

1. **Defense in Depth**: Even if application code forgets `WHERE tenantId = ?`, database blocks access
2. **Zero Trust**: Database enforces isolation, not just application
3. **Audit Trail**: All queries logged with tenant context
4. **Super Admin Support**: NULL tenant allows global access
5. **Performance**: Minimal overhead (~2-5ms per request)

:::tip Best Practice
Always set RLS context in JWT strategy. Never rely on manual WHERE clauses for tenant isolation.
:::

## Authentication Schema

### RefreshToken Model

```prisma
model RefreshToken {
  id            String    @id @default(cuid())
  token         String    @unique @db.VarChar(500)
  userId        String
  deviceInfo    String?   @db.VarChar(255)
  ipAddress     String?   @db.VarChar(45)
  expiresAt     DateTime  @db.Timestamptz(6)
  revokedAt     DateTime? @db.Timestamptz(6)
  revokedReason String?   @db.VarChar(255)
  isRevoked     Boolean   @default(false)
  createdAt     DateTime  @default(now()) @db.Timestamptz(6)

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([expiresAt, isRevoked])   // Cleanup query
  @@index([userId, isRevoked])      // Active tokens per user
}
```

**Purpose**: Store refresh tokens for revocation and device tracking

**Cleanup Strategy**:

```typescript
// Delete expired tokens (scheduled job)
await prisma.refreshToken.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: new Date() } },
      { isRevoked: true, revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    ],
  },
});
```

### Session Model

```prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  deviceInfo   String?  @db.VarChar(255)
  ipAddress    String?  @db.VarChar(45)
  userAgent    String?  @db.VarChar(500)
  lastActivity DateTime @default(now()) @db.Timestamptz(6)
  expiresAt    DateTime @db.Timestamptz(6)
  createdAt    DateTime @default(now()) @db.Timestamptz(6)

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

**Purpose**: Track active sessions for "View Active Sessions" feature (future)

## RBAC Schema

### Role Model

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  description String?
  tenantId    String?
  type        String   @default("custom") @db.VarChar(50)
  level       Int      @default(0) @db.SmallInt
  permissions String[] @default([])
  metadata    Json?
  isSystem    Boolean  @default(false)
  isDefault   Boolean  @default(false)
  status      String   @default("active") @db.VarChar(50)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  tenant      Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  users       User[]

  @@unique([name, tenantId])
  @@index([tenantId])
  @@index([type])
  @@index([status])
  @@index([tenantId, type])
  @@index([tenantId, status])
}
```

**Key Fields**:

- `type`: "system" (global) or "custom" (tenant-specific)
- `level`: Hierarchy level (higher = more privileged)
- `permissions`: Array of permission strings (e.g., `["users:read", "appointments:create"]`)
- `isSystem`: Cannot be deleted or modified
- `isDefault`: Assigned to new users by default

**System Roles**:

```typescript
const SYSTEM_ROLES = [
  { name: 'Super Admin', type: 'system', level: 100, tenantId: null },
  { name: 'Tenant Admin', type: 'system', level: 90, tenantId: null },
  { name: 'Staff', type: 'system', level: 50, tenantId: null },
  { name: 'Client', type: 'system', level: 10, tenantId: null },
];
```

### Permission Model

```prisma
model Permission {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(100)
  description String
  resource    String   @db.VarChar(100)
  action      String   @db.VarChar(50)
  category    String   @db.VarChar(100)
  metadata    Json?
  isSystem    Boolean  @default(true)
  createdAt   DateTime @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @db.Timestamptz(6)

  @@unique([resource, action])
  @@index([category])
  @@index([resource])
}
```

**Permission Format**: `resource:action:scope`

**Examples**:

- `users:read:all` - Read all users (cross-tenant for super admin)
- `users:read:own` - Read users in own tenant
- `appointments:create:own` - Create appointments in own tenant
- `billing:delete:all` - Delete any billing record

**Seeded Permissions**:

```typescript
const PERMISSIONS = [
  { name: 'users:read:all', resource: 'users', action: 'read', category: 'User Management' },
  { name: 'users:create:own', resource: 'users', action: 'create', category: 'User Management' },
  {
    name: 'appointments:read:own',
    resource: 'appointments',
    action: 'read',
    category: 'Appointments',
  },
  // ... 50+ permissions
];
```

## Audit Log Schema

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String?
  tenantId     String?
  action       String   @db.VarChar(100)
  resource     String?  @db.VarChar(100)
  resourceId   String?
  method       String?  @db.VarChar(10)
  path         String?  @db.VarChar(500)
  statusCode   Int?     @db.SmallInt
  ipAddress    String?  @db.VarChar(45)
  userAgent    String?  @db.VarChar(500)
  oldData      Json?
  newData      Json?
  metadata     Json?
  success      Boolean  @default(true)
  errorMessage String?
  createdAt    DateTime @default(now()) @db.Timestamptz(6)

  tenant       Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user         User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([tenantId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@index([tenantId, createdAt(sort: Desc)])  // Tenant logs sorted by time
  @@index([tenantId, action])
  @@index([tenantId, resource])
}
```

**Usage**:

```typescript
// Log user update
await prisma.auditLog.create({
  data: {
    userId: currentUser.id,
    tenantId: currentUser.tenantId,
    action: 'USER_UPDATED',
    resource: 'User',
    resourceId: updatedUser.id,
    method: 'PATCH',
    path: `/api/v1/admin/users/${updatedUser.id}`,
    statusCode: 200,
    ipAddress: req.ip,
    oldData: oldUser,
    newData: updatedUser,
    success: true,
  },
});
```

## Indexing Strategy

### Index Types

1. **Single Column**: Foreign keys, frequently filtered columns
2. **Composite**: Multi-column queries (tenant + status, tenant + createdAt)
3. **Unique**: Enforce uniqueness constraints
4. **Partial** (future): Index subset of rows

### Index Guidelines

**Always Index**:

- All foreign keys (`tenantId`, `userId`, `roleId`)
- Frequently queried columns (`email`, `status`, `createdAt`)
- Unique constraints (`email`, `slug`, `token`)

**Composite Indexes**:

- Common query patterns: `[tenantId, status]`, `[tenantId, createdAt]`
- Multi-column WHERE clauses
- ORDER BY columns

**Example**:

```prisma
model Appointment {
  id        String   @id
  tenantId  String
  staffId   String
  startTime DateTime
  status    String

  @@index([tenantId])                     // Single: tenant filter
  @@index([tenantId, staffId, startTime]) // Composite: staff schedule
  @@index([tenantId, status, startTime])  // Composite: status filter
}
```

## Data Types Best Practices

### String Fields

```prisma
// ✅ GOOD: Specific length limits
email       String  @db.VarChar(255)
firstName   String  @db.VarChar(100)
description String  @db.Text

// ❌ BAD: No length limit
email       String
```

### DateTime Fields

```prisma
// ✅ GOOD: Timezone-aware
createdAt   DateTime @default(now()) @db.Timestamptz(6)

// ❌ BAD: No timezone
createdAt   DateTime @default(now())
```

### Integer Fields

```prisma
// ✅ GOOD: Appropriate size
loginAttempts Int @db.SmallInt  // Max 32,767
userCount     Int @db.Integer   // Max 2,147,483,647

// ❌ BAD: Wastes space
loginAttempts Int  // Defaults to Integer
```

### JSON Fields

```prisma
// ✅ GOOD: JSONB for indexable queries
settings Json @db.JsonB

// ❌ BAD: JSON (not indexable)
settings Json
```

## Migrations

### Creating Migrations

```bash
# Create migration with descriptive name
bunx prisma migrate dev --name add_email_verification_fields

# Apply migrations to production
bunx prisma migrate deploy

# Reset database (DEVELOPMENT ONLY)
bunx prisma migrate reset
```

### Safe Schema Changes

**Adding Columns** (safe):

```prisma
// Step 1: Add as optional
model User {
  newField String?  // Nullable first
}

// Step 2: Deploy migration

// Step 3: Backfill data (if needed)

// Step 4: Make required (optional)
model User {
  newField String  // Remove ?
}
```

**Dropping Columns** (dangerous):

1. Remove from code (but keep in schema)
2. Deploy code changes
3. Wait 1 week (ensure nothing uses it)
4. Remove from schema
5. Generate migration to drop column

**Adding Indexes** (safe in PostgreSQL):

```sql
-- Use CONCURRENTLY to avoid table locks
CREATE INDEX CONCURRENTLY idx_users_email ON "User"("email");
```

:::warning
Prisma doesn't generate `CONCURRENTLY` - edit migration file manually for production.
:::

## Query Optimization

### Avoid N+1 Queries

```typescript
// ❌ BAD: N+1 query (1 + N queries)
const users = await prisma.user.findMany();
for (const user of users) {
  const role = await prisma.role.findUnique({ where: { id: user.roleId } });
}

// ✅ GOOD: Single query with JOIN
const users = await prisma.user.findMany({
  include: { role: true },
});

// ✅ BETTER: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    email: true,
    firstName: true,
    role: { select: { name: true } },
  },
});
```

### Always Paginate

```typescript
// ❌ BAD: No limit (could return millions)
const users = await prisma.user.findMany({ where: { tenantId } });

// ✅ GOOD: Paginated
const users = await prisma.user.findMany({
  where: { tenantId },
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' },
});
```

### Use Transactions

```typescript
// ✅ GOOD: Atomic operations
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.auditLog.create({ data: { userId: user.id, action: 'USER_CREATED' } });
  return user;
});

// ❌ BAD: Not atomic (could partially fail)
const user = await prisma.user.create({ data: userData });
await prisma.auditLog.create({ data: { userId: user.id, action: 'USER_CREATED' } });
```

## Performance Monitoring

### Slow Query Detection

```sql
-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- 100ms threshold
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Connection Pool Monitoring

```typescript
// Check active connections
const connections = await prisma.$queryRaw<[{ count: bigint }]>`
  SELECT count(*) FROM pg_stat_activity
`;

// Check connection pool stats
console.log('Pool stats:', prisma.$metrics.pool);
```

## Database Maintenance

### Regular Tasks

**Daily**:

- Clean up expired tokens: `DELETE FROM "RefreshToken" WHERE expiresAt < NOW()`
- Archive old audit logs (>90 days)

**Weekly**:

- Vacuum tables: `VACUUM ANALYZE`
- Review slow queries

**Monthly**:

- Rebuild indexes: `REINDEX DATABASE ftry`
- Review table sizes: `SELECT * FROM pg_database_size('ftry')`

### Backup Strategy

```bash
# Daily backup
pg_dump -U postgres -d ftry -F c -f backup_$(date +%Y%m%d).dump

# Restore from backup
pg_restore -U postgres -d ftry -c backup_20251011.dump
```

## Troubleshooting

### Migration Fails

```bash
# Check migration status
bunx prisma migrate status

# Check schema drift
bunx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-database $DATABASE_URL

# Force reset (DEVELOPMENT ONLY)
bunx prisma migrate reset
```

### RLS Debugging

```typescript
// Check current tenant context
const context = await prisma.$queryRaw<[{ current_setting: string }]>`
  SELECT current_setting('app.current_tenant_id', true) AS current_setting
`;
console.log('Current tenant:', context[0]?.current_setting);

// Clear context for admin operations
await prisma.$executeRaw`SELECT set_tenant_context(NULL)`;
```

## Next Steps

- [Authentication Architecture](./authentication.md) - JWT and refresh tokens
- [Backend Architecture](./backend.md) - NestJS services using Prisma
- [API Reference](../api/overview.md) - REST endpoints

---

**Last Updated**: 2025-10-11
**Schema Version**: Migration 20251008_add_rls
**Health Score**: 78/100 (Good)
