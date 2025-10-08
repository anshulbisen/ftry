# Database Documentation

PostgreSQL 16 database with Prisma 6 ORM for multi-tenant SaaS architecture.

## Quick Reference

### Common Commands

```bash
# View database in browser
bunx prisma studio

# Create migration
bunx prisma migrate dev --name migration_name

# Apply migrations (production)
bunx prisma migrate deploy

# Seed database
bunx prisma db seed

# Reset database (dev only)
bunx prisma migrate reset --force
```

### Connection

**Development**:

```bash
DATABASE_URL=postgresql://ftry:ftry@localhost:5432/ftry
```

**Production**:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database?connection_limit=10&pool_timeout=20
```

## Schema Overview

### Core Tables

1. **Tenant** - Multi-tenant isolation
2. **User** - User accounts with soft delete
3. **Role** - RBAC roles
4. **Permission** - Fine-grained permissions
5. **RefreshToken** - JWT refresh tokens
6. **Session** - Active user sessions
7. **AuditLog** - Security and action logging

### Multi-Tenancy

**Shared Schema Pattern**:

- All tenants share the same tables
- Each row has `tenantId` foreign key
- Super admin: `tenantId = NULL`
- Cost-effective for 1000-10,000 tenants

**Query Pattern**:

```typescript
// ALWAYS filter by tenantId
const users = await prisma.user.findMany({
  where: {
    tenantId: currentUser.tenantId,
    isDeleted: false,
  },
});
```

## Data Types

### PostgreSQL-Specific Types

All tables use optimized PostgreSQL types:

```prisma
model User {
  email       String    @db.VarChar(255)   // Not TEXT
  loginAttempts Int     @db.SmallInt       // Not INTEGER
  createdAt   DateTime  @db.Timestamptz    // Timezone-aware
  metadata    Json      @db.JsonB          // Indexable JSON
}
```

**Benefits**:

- Smaller storage size
- Better index performance
- Built-in validation

## Indexes

### Performance Indexes

**User table**:

```sql
-- Login queries (partial index)
CREATE INDEX "User_active_email_idx" ON "User"("email")
  WHERE "isDeleted" = false AND "status" = 'active';

-- Tenant queries
CREATE INDEX "User_tenantId_isDeleted_idx" ON "User"("tenantId", "isDeleted");
```

**RefreshToken table**:

```sql
-- Token validation
CREATE INDEX "RefreshToken_userId_isRevoked_idx"
  ON "RefreshToken"("userId", "isRevoked");

-- Active tokens only
CREATE INDEX "RefreshToken_active_idx"
  ON "RefreshToken"("userId", "expiresAt")
  WHERE "isRevoked" = false;
```

### Index Monitoring

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Constraints

### Data Integrity

**Soft Delete Consistency**:

```sql
ALTER TABLE "User"
ADD CONSTRAINT "User_soft_delete_consistency_check"
CHECK (
  ("isDeleted" = false AND "deletedAt" IS NULL) OR
  ("isDeleted" = true AND "deletedAt" IS NOT NULL)
);
```

**Email Format** (example from auth_optimizations):

```sql
ALTER TABLE "User"
ADD CONSTRAINT "User_email_format_check"
CHECK ("email" ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$');
```

## Migrations

### Creating Migrations

```bash
# 1. Update schema.prisma
# 2. Create migration
bunx prisma migrate dev --name descriptive_name

# Examples:
bunx prisma migrate dev --name add_appointment_model
bunx prisma migrate dev --name add_user_email_index
```

### Migration Best Practices

**Naming**:

- ✅ `add_appointment_model`
- ✅ `update_user_email_unique_constraint`
- ❌ `update` (too vague)
- ❌ `migration1` (meaningless)

**Safety**:

- Test on staging first
- Use transactions (Prisma default)
- Avoid `CONCURRENTLY` in development (causes issues)
- Back up before major migrations

**Column Changes**:

```typescript
// BAD: Direct rename (drops and recreates)
model User {
  newName String @map("old_name") // Dangerous!
}

// GOOD: Multi-step migration
// Step 1: Add new column
model User {
  oldName String?
  newName String?
}

// Step 2: Migrate data (in migration SQL)
UPDATE "User" SET "newName" = "oldName";

// Step 3: Remove old column
model User {
  newName String
}
```

## Prisma Best Practices

### Avoid N+1 Queries

```typescript
// BAD: N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  const role = await prisma.role.findUnique({ where: { id: user.roleId } });
}

// GOOD: Single query with include
const users = await prisma.user.findMany({
  include: { role: true },
});
```

### Always Paginate

```typescript
// BAD: No limit
const users = await prisma.user.findMany();

// GOOD: Paginated
const users = await prisma.user.findMany({
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' },
});
```

### Use Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.auditLog.create({
    data: {
      action: 'user.created',
      userId: user.id,
      tenantId: user.tenantId,
    },
  });
});
```

## Soft Delete Pattern

### Implementation

```typescript
// Soft delete
await prisma.user.update({
  where: { id },
  data: {
    isDeleted: true,
    deletedAt: new Date(),
  },
});

// Query (exclude deleted)
const activeUsers = await prisma.user.findMany({
  where: {
    tenantId,
    isDeleted: false, // Always filter!
  },
});
```

### Middleware (Auto-filter)

```typescript
// In PrismaService
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      isDeleted: false,
    };
  }
  return next(params);
});
```

## Seeding

### Demo Data

```bash
bunx prisma db seed
```

Creates:

- 2 demo tenants
- 5 demo users
- 5 system roles
- 20 permissions

Customize with environment variable:

```bash
DEMO_PASSWORD=CustomPass123! bunx prisma db seed
```

### Seed Script

Location: `/prisma/seed.ts`

## Monitoring

### Query Performance

```sql
-- Slow queries (requires pg_stat_statements)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Connection Pool

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity
WHERE datname = 'ftry';

-- Max connections
SHOW max_connections;
```

## Backup & Recovery

### Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema.sql

# Data only
pg_dump --data-only $DATABASE_URL > data.sql
```

### Restore

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql

# Restore specific table
pg_restore -t users backup.sql
```

## Troubleshooting

### Migration Fails

```bash
# Check migration status
bunx prisma migrate status

# Resolve failed migration
bunx prisma migrate resolve --rolled-back migration_name
bunx prisma migrate deploy

# Reset (dev only - destroys data!)
bunx prisma migrate reset --force
```

### Schema Drift

```bash
# Check if schema matches database
bunx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma
```

### Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check if database exists
psql -U ftry -h localhost -l

# Create database if missing
createdb -U ftry ftry
```

## Related Files

- Schema: `/prisma/schema.prisma`
- Migrations: `/prisma/migrations/`
- Seed: `/prisma/seed.ts`
- Guidelines: `/prisma/CLAUDE.md`

---

**Last Updated**: 2025-10-08
**Database**: PostgreSQL 16
**ORM**: Prisma 6
