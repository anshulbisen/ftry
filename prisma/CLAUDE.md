# Prisma Schema & Database Quick Reference

Quick reference for database operations in the ftry project.

## Current Status

**Database**: PostgreSQL 18 with Prisma 6.16.3
**Health Score**: 78/100 (Good - some improvements pending)
**RLS Status**: ✅ ACTIVE (automatic tenant isolation)
**Production Ready**: ⚠️ Pending P0 fixes (Redis caching for JWT strategy)

**Complete Review**: See `/docs/DATABASE_ARCHITECTURE_REVIEW.md`

## Quick Commands

```bash
# Generate Prisma client (after schema changes)
bunx prisma generate

# Create migration
bunx prisma migrate dev --name descriptive_name

# Apply migrations (production)
bunx prisma migrate deploy

# Database GUI
bunx prisma studio

# Reset database (DEVELOPMENT ONLY)
bunx prisma migrate reset
```

## Schema Design Essentials

### Multi-Tenant Pattern

```prisma
model User {
  id        String   @id @default(cuid())
  tenantId  String?  // NULL for super admins
  email     String   @db.VarChar(255)

  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([email, tenantId])  // Same email across tenants OK
  @@index([tenantId])          // CRITICAL for performance
}
```

**Key Points**:

- Always include `tenantId` in tenant-scoped models
- Index on `tenantId` is required
- NULL tenantId = super admin access
- Cascade delete: tenant → users

### Data Type Best Practices

```prisma
// ✅ GOOD: Specific database types
model User {
  email       String      @db.VarChar(255)  // Limit length
  createdAt   DateTime    @db.Timestamptz   // Timezone-aware
  loginAttempts Int       @db.SmallInt      // Save space
  settings    Json        @db.JsonB         // Indexable JSON
}

// ❌ BAD: Generic types
model User {
  email       String      // No limit
  createdAt   DateTime    // No timezone
  loginAttempts Int       // Wastes space
  settings    Json        // Not indexable
}
```

### Indexing Strategy

```prisma
model Appointment {
  tenantId  String
  staffId   String
  startTime DateTime @db.Timestamptz
  status    String

  // Single column indexes
  @@index([tenantId])

  // Composite indexes for common queries
  @@index([tenantId, staffId, startTime])     // Staff schedule
  @@index([tenantId, status, startTime])      // Status filtering
}
```

**Rule**: Index every foreign key + composite indexes for common query patterns.

## Row-Level Security (RLS)

**Status**: ✅ ACTIVE - Automatic tenant isolation on every request

### How It Works

```typescript
// JWT strategy automatically sets tenant context
// In libs/backend/auth/src/lib/strategies/jwt.strategy.ts
async validate(payload: JwtPayload) {
  // CRITICAL: Set RLS context BEFORE any queries
  await this.prisma.setTenantContext(payload.tenantId);

  // All subsequent queries are tenant-scoped
  const user = await this.prisma.user.findUnique(...);
  // Returns ONLY current tenant's data (RLS enforced)
}
```

**Benefits**:

- Even if you forget WHERE clause, database blocks cross-tenant access
- Zero-trust security: database enforces, not just application
- Super admin support: NULL tenantId = see all tenants

### Testing RLS

```sql
-- Set tenant context
SELECT set_tenant_context('tenant-1');

-- Query users (only tenant-1 users returned)
SELECT * FROM "User";

-- Switch context
SELECT set_tenant_context('tenant-2');
SELECT * FROM "User";  -- Now only tenant-2 users

-- Super admin (see all)
SELECT set_tenant_context(NULL);
SELECT * FROM "User";  -- All users from all tenants
```

**Full Guide**: See `docs/RLS_INTEGRATION_REPORT.md`

## Migration Best Practices

### Creating Migrations

```bash
# Always use descriptive names
bunx prisma migrate dev --name add_email_verification_fields

# NOT
bunx prisma migrate dev --name update
```

### Safe Schema Changes

**Adding Columns (Safe)**:

```prisma
// Step 1: Add as optional
model User {
  newField String?  // Nullable first
}
# Generate migration: bunx prisma migrate dev --name add_user_new_field

// Step 2: Backfill data (if needed)

// Step 3: Make required (later)
model User {
  newField String  // Remove ? after backfill
}
```

**Dropping Columns (Dangerous)**:

1. Remove from schema
2. Deploy code (ensure nothing uses it)
3. Wait 1 week (validation)
4. Generate migration to drop
5. Deploy migration

### Production Index Creation

```sql
-- ✅ GOOD: Non-blocking
CREATE INDEX CONCURRENTLY idx_users_email ON "User"("email");

-- ❌ BAD: Blocks table
CREATE INDEX idx_users_email ON "User"("email");
```

**Note**: Prisma doesn't generate CONCURRENTLY - edit migration manually

**Complete Guide**: See `docs/database/MIGRATION_GUIDE.md` (future)

## Query Optimization

### Avoid N+1 Queries

```typescript
// ❌ BAD: N+1 query
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
    role: { select: { name: true } },
  },
});
```

### Always Paginate

```typescript
// ❌ BAD: No limit
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
  await tx.auditLog.create({ data: { userId: user.id, action: 'created' } });
  return user;
});
```

**Complete Guide**: See `docs/database/QUERY_OPTIMIZATION_GUIDE.md` (future)

## Common Patterns

### Soft Delete

```typescript
// Soft delete user
await prisma.user.update({
  where: { id },
  data: { isDeleted: true, deletedAt: new Date() },
});

// Always filter deleted records
const users = await prisma.user.findMany({
  where: { tenantId, isDeleted: false },
});
```

### Unique Constraints with Tenant

```prisma
model Service {
  name      String
  tenantId  String

  @@unique([name, tenantId])  // Same service name across tenants OK
}
```

## Critical Issues & Workarounds

### P0: JWT Strategy Performance

**Issue**: Database queried on EVERY authenticated request (no caching)
**Impact**: Will fail at ~50 concurrent users
**Workaround**: Redis caching pending implementation
**ETA**: Priority fix in next sprint

**Details**: See `docs/DATABASE_ARCHITECTURE_REVIEW.md` section 3.2

### Connection Reliability

**Status**: ✅ RESOLVED

PrismaService includes retry logic with exponential backoff:

- Max 5 retries
- Initial 2s delay, exponential backoff to max 10s
- Total max wait: ~30s
- Prevents Docker crashes from aggressive connections

## Troubleshooting

### Migration Fails

```bash
# Check migration status
bunx prisma migrate status

# Check schema vs database drift
bunx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-database $DATABASE_URL

# Reset (DEVELOPMENT ONLY)
bunx prisma migrate reset
```

### Slow Queries

```sql
-- Find slow queries (requires pg_stat_statements extension)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### RLS Debugging

```typescript
// Check current tenant context
const context = await prisma.$executeRaw`
  SELECT current_setting('app.current_tenant_id', true)
`;
console.log('Current tenant:', context);

// Clear context for admin operations
await prisma.$executeRaw`SELECT set_tenant_context(NULL)`;
```

## Security Checklist

- [ ] Always use parameterized queries (never `$queryRawUnsafe`)
- [ ] Always scope queries by tenantId (or rely on RLS)
- [ ] Never expose password hashes in responses
- [ ] Use transactions for related operations
- [ ] Validate user input before database queries
- [ ] Log security events (failed logins, lockouts)
- [ ] Encrypt PII fields (future: User.phone, User.email)

## Performance Monitoring

```typescript
// Enable query logging (development)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

// Check active connections
const connections = await prisma.$queryRaw`
  SELECT count(*) FROM pg_stat_activity
`;
```

## Module-Specific Guidance

**Authentication**: See `libs/backend/auth/CLAUDE.md` for:

- JWT strategy RLS integration
- User model usage patterns
- Refresh token management

**Full Database Review**: See `docs/DATABASE_ARCHITECTURE_REVIEW.md` for:

- Complete schema analysis (60 pages)
- Performance optimization recommendations
- Security audit findings
- Production readiness checklist

## Resources

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Multi-Tenancy with RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

## Maintenance Tasks

**Weekly**: Review slow queries, check connection pool usage
**Monthly**: Clean up expired tokens, vacuum tables, archive old logs
**Quarterly**: Test backup/restore, review indexes, update Prisma

---

**Last Updated**: 2025-10-08
**Prisma Version**: 6.16.3
**PostgreSQL Version**: 18
**Line Count**: ~285 (Target: <300)
