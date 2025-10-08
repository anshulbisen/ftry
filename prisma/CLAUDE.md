# Prisma Schema Guidelines - ftry Database

## Overview

This directory contains the Prisma schema and migrations for the ftry Salon SaaS application. The schema is designed for multi-tenancy, security, and scalability.

## Schema Design Principles

### 1. Multi-Tenant Architecture

**Core Principle**: Shared schema with tenant discriminator (`tenantId`)

```prisma
model User {
  id        String   @id @default(cuid())
  tenantId  String?  // NULL for super admins
  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([email, tenantId]) // Same email allowed across tenants
  @@index([tenantId])         // Critical for tenant-scoped queries
}
```

**Design Decisions**:

- Cost-effective for Indian SMB market (target: 1000-10,000 salons)
- Simpler migrations and backups
- Natural tenant isolation via WHERE clauses
- Requires Row-Level Security for defense-in-depth

### 2. Data Type Best Practices

**Use Specific Database Types**:

```prisma
// BAD: Generic types
model User {
  email       String
  createdAt   DateTime
}

// GOOD: Specific database types
model User {
  email       String      @db.VarChar(255)
  createdAt   DateTime    @db.Timestamptz
  loginAttempts Int       @db.SmallInt
  settings    Json        @db.JsonB
}
```

**Data Type Guidelines**:

- String → @db.VarChar(N) or @db.Text
- DateTime → @db.Timestamptz (timezone-aware)
- Int (small) → @db.SmallInt (saves space)
- Json → @db.JsonB (indexable, faster)
- Decimal (money) → @db.Money for currency

**Use Enums for Fixed Values**:

```prisma
// GOOD: Type-safe enums
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  LOCKED
}

model User {
  status UserStatus @default(ACTIVE)
}
```

### 3. Indexing Strategy

**Rule**: Every foreign key needs an index for JOIN performance

```prisma
model User {
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId]) // Required for queries like WHERE tenantId = ?
}
```

**Composite Indexes for Common Queries**:

```prisma
model Appointment {
  tenantId  String
  startTime DateTime @db.Timestamptz
  staffId   String
  status    String

  // Common query: "Get appointments for staff on specific day"
  @@index([tenantId, staffId, startTime])

  // Common query: "Get upcoming appointments by status"
  @@index([tenantId, status, startTime])
}
```

**Partial Indexes for Large Tables**:

```prisma
model User {
  isDeleted Boolean @default(false)
  status    UserStatus

  // Only index active, non-deleted users (smaller index)
  // Note: Defined in migration SQL, Prisma doesn't support partial indexes yet
  // CREATE INDEX idx_active_users ON "User"("tenantId") WHERE "isDeleted" = false
}
```

### 4. Constraints & Validation

**Database-Level Constraints** (defined in migrations):

```sql
-- Email format validation
ALTER TABLE "User"
ADD CONSTRAINT check_email_format
CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Positive values
ALTER TABLE "Tenant"
ADD CONSTRAINT check_max_users_positive
CHECK ("maxUsers" > 0);

-- Date ordering
ALTER TABLE "RefreshToken"
ADD CONSTRAINT check_expires_at_future
CHECK ("expiresAt" > "createdAt");
```

**Application-Level Validation** (Prisma + NestJS):

```typescript
// Use class-validator in DTOs
export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsStrongPassword()
  @MinLength(8)
  password: string;
}
```

### 5. Relationships & Cascading

**Cascade Delete Rules**:

```prisma
model User {
  // Cascade: Delete tenant → delete all users
  tenant Tenant? @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Restrict: Cannot delete role if users exist
  role Role @relation(fields: [roleId], references: [id], onDelete: Restrict)

  // SetNull: Delete creator → set createdBy to NULL
  creator User? @relation("UserCreator", fields: [createdBy], references: [id], onDelete: SetNull)
}
```

**Design Guideline**:

- Parent-child data: Cascade (tenant→users, user→tokens)
- Reference data: Restrict (user→role)
- Audit fields: SetNull (user→createdBy)

### 6. Soft Deletes

**Pattern**:

```prisma
model User {
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime? @db.Timestamptz

  // Ensure consistency
  // CHECK (isDeleted = false AND deletedAt IS NULL) OR (isDeleted = true AND deletedAt IS NOT NULL)
}
```

**Querying**:

```typescript
// Always filter out soft-deleted records
const users = await prisma.user.findMany({
  where: {
    tenantId,
    isDeleted: false, // Don't forget!
  },
});
```

**Best Practice**: Use middleware to auto-filter

```typescript
// In PrismaService
prisma.$use(async (params, next) => {
  if (params.model && params.action === 'findMany') {
    params.args.where = { ...params.args.where, isDeleted: false };
  }
  return next(params);
});
```

## Migration Best Practices

### 1. Creating Migrations

**Always name migrations descriptively**:

```bash
# BAD
bun prisma migrate dev --name update

# GOOD
bun prisma migrate dev --name add_email_verification_fields
bun prisma migrate dev --name create_appointment_model
bun prisma migrate dev --name add_index_user_tenant_status
```

### 2. Schema Changes

**Adding Columns (Safe)**:

```prisma
// Step 1: Add nullable column
model User {
  newField String? // Make optional first
}

// Generate migration
// bun prisma migrate dev --name add_user_new_field

// Step 2: (Optional) Backfill data in application or migration SQL

// Step 3: Make required later
model User {
  newField String // Remove ? after backfill
}

// Generate second migration
// bun prisma migrate dev --name make_new_field_required
```

**Renaming Columns (Dangerous - Use Transition Period)**:

```prisma
// DON'T use Prisma rename - it drops and recreates
// @map("new_name") ← This is dangerous!

// DO: Add new column, deprecate old, migrate data
model User {
  oldField String?  // Keep temporarily
  newField String?  // Add new
}

// After data migration and code update:
model User {
  newField String   // Keep only new
}
```

**Deleting Columns (Dangerous)**:

```bash
# Step 1: Remove from Prisma schema
# Step 2: Deploy application (ensure no code uses column)
# Step 3: Wait 1 week (validation period)
# Step 4: Generate migration to drop column
# Step 5: Deploy migration
```

### 3. Index Creation

**Production Migrations Must Be Non-Blocking**:

```sql
-- GOOD: Non-blocking index creation
CREATE INDEX CONCURRENTLY idx_users_email ON "User"("email");

-- BAD: Blocking index creation (locks table)
CREATE INDEX idx_users_email ON "User"("email");
```

**Prisma Limitation**: Prisma doesn't generate CONCURRENTLY indexes. Manually edit migrations:

```bash
# Generate migration
bun prisma migrate dev --name add_user_email_index

# Edit migration file
# Change: CREATE INDEX → CREATE INDEX CONCURRENTLY
```

### 4. Data Migrations

**Batch Updates for Large Tables**:

```sql
-- BAD: Single update (locks table for long time)
UPDATE "User" SET "status" = 'active' WHERE "status" IS NULL;

-- GOOD: Batched updates
DO $$
DECLARE
  batch_size INT := 1000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE "User"
    SET "status" = 'active'
    WHERE "id" IN (
      SELECT "id" FROM "User"
      WHERE "status" IS NULL
      LIMIT batch_size
    );

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;

    PERFORM pg_sleep(0.1); -- Prevent lock escalation
  END LOOP;
END $$;
```

### 5. Testing Migrations

**Before Deploying**:

```bash
# 1. Test on production-size dataset copy
pg_dump prod_db | psql test_db
psql test_db < migration.sql

# 2. Measure migration time
\timing
\i migration.sql

# 3. Verify data integrity
SELECT count(*) FROM "User" WHERE "email" IS NULL;

# 4. Check index creation
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'User';
```

## Query Optimization

### 1. Avoid N+1 Queries

**Problem**:

```typescript
// BAD: N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  const role = await prisma.role.findUnique({ where: { id: user.roleId } });
  console.log(user.email, role.name);
}
// This makes 1 + N queries!
```

**Solution 1: Use include**:

```typescript
// GOOD: Single query with JOIN
const users = await prisma.user.findMany({
  include: { role: true },
});
users.forEach((user) => console.log(user.email, user.role.name));
```

**Solution 2: Use select for minimal data**:

```typescript
// BETTER: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    email: true,
    role: {
      select: { name: true },
    },
  },
});
```

### 2. Always Paginate

```typescript
// BAD: No limit (can return millions of rows)
const users = await prisma.user.findMany({ where: { tenantId } });

// GOOD: Paginated
const users = await prisma.user.findMany({
  where: { tenantId },
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' },
});
```

### 3. Use Transactions for Related Operations

```typescript
// GOOD: Atomic user creation with audit log
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email, password, tenantId },
  });

  await tx.auditLog.create({
    data: {
      action: 'user.created',
      userId: user.id,
      tenantId,
      newData: user,
    },
  });

  return user;
});
```

### 4. Raw Queries for Complex Operations

```typescript
// When Prisma query builder is too complex, use raw SQL
const revenue = await prisma.$queryRaw<{ month: string; revenue: number }[]>`
  SELECT 
    DATE_TRUNC('month', "createdAt") as month,
    SUM("amount") as revenue
  FROM "Invoice"
  WHERE "tenantId" = ${tenantId}
    AND "status" = 'paid'
    AND "createdAt" >= ${startDate}
  GROUP BY DATE_TRUNC('month', "createdAt")
  ORDER BY month DESC
`;
```

## Security Guidelines

### 1. Never Trust User Input

```typescript
// DANGEROUS: SQL injection risk
const email = req.body.email;
await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE "email" = '${email}'`);

// SAFE: Parameterized query
await prisma.$queryRaw`SELECT * FROM "User" WHERE "email" = ${email}`;
```

### 2. Always Scope by Tenant

```typescript
// BAD: Missing tenant filter
const user = await prisma.user.findUnique({ where: { email } });

// GOOD: Tenant-scoped query
const user = await prisma.user.findUnique({
  where: {
    email_tenantId: {
      email,
      tenantId: currentUser.tenantId,
    },
  },
});
```

### 3. Use Row-Level Security (RLS)

**Enable in migration**:

```sql
-- Enable RLS on tenant-scoped tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "User"
FOR ALL
USING ("tenantId" = current_setting('app.current_tenant_id', true)::TEXT);
```

**Set context in application**:

```typescript
// In auth middleware
await prisma.$executeRaw`
  SELECT set_config('app.current_tenant_id', ${user.tenantId}, true)
`;
```

### 4. Encrypt PII

**Fields to encrypt** (future enhancement):

- User.email
- User.phone
- User.firstName
- User.lastName

See docs/DATABASE_ARCHITECTURE.md for encryption implementation.

## Performance Monitoring

### 1. Enable Query Logging (Development)

```typescript
// In PrismaService constructor
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

### 2. Use EXPLAIN ANALYZE

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM "User"
WHERE "tenantId" = 'tenant_123'
  AND "status" = 'active'
  AND "isDeleted" = false;

-- Look for:
-- - Seq Scan (bad) → needs index
-- - Index Scan (good)
-- - Execution time < 50ms (target)
```

### 3. Monitor Connection Pool

```typescript
// Check active connections
const connections = await prisma.$queryRaw`
  SELECT count(*) FROM pg_stat_activity
`;
console.log('Active connections:', connections);
```

## Common Patterns

### 1. Soft Delete

```typescript
// Soft delete user
await prisma.user.update({
  where: { id },
  data: {
    isDeleted: true,
    deletedAt: new Date(),
  },
});

// Filter out deleted users
const activeUsers = await prisma.user.findMany({
  where: {
    tenantId,
    isDeleted: false,
  },
});
```

### 2. Audit Trail

```typescript
// Log all user actions
async function withAuditLog<T>(
  action: string,
  userId: string,
  tenantId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const result = await operation();

  await prisma.auditLog.create({
    data: {
      action,
      userId,
      tenantId,
      success: true,
      newData: result as any,
    },
  });

  return result;
}
```

### 3. Unique Constraints with Tenant

```prisma
model Service {
  name      String
  tenantId  String

  @@unique([name, tenantId]) // Same service name across tenants OK
}
```

### 4. Optimistic Locking

```prisma
model Appointment {
  id       String   @id
  version  Int      @default(1) // Increment on each update

  // In application:
  // 1. Read version
  // 2. Update where id = X AND version = Y
  // 3. If rowCount = 0, version conflict!
}
```

## Troubleshooting

### Migration Fails

```bash
# Reset database (DEVELOPMENT ONLY!)
bun prisma migrate reset

# Check migration status
bun prisma migrate status

# Manually apply migration
psql ftry_dev < prisma/migrations/XXXXXX_migration.sql
```

### Schema Drift

```bash
# Check if schema and database are in sync
bun prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-database $DATABASE_URL
```

### Slow Queries

```sql
-- Find slow queries (requires pg_stat_statements)
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Multi-Tenancy Patterns](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Maintenance Tasks

### Weekly

- Review slow queries via pg_stat_statements
- Check connection pool usage
- Monitor table sizes

### Monthly

- Vacuum and analyze tables
- Clean up expired refresh tokens
- Archive old audit logs

### Quarterly

- Review and optimize indexes
- Test backup/restore procedures
- Update Prisma and PostgreSQL versions
