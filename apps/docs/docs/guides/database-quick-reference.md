# Database Quick Reference

Essential database commands and operations for ftry Salon SaaS.

**Database**: PostgreSQL 18 with Prisma 6 | **Last Updated**: 2025-10-11

## Quick Stats

| Metric           | Value  | Status       |
| ---------------- | ------ | ------------ |
| Health Score     | 85/100 | ✅ Excellent |
| Production Ready | Yes    | ✅ Approved  |
| RLS Status       | ACTIVE | ✅ Enforced  |
| Cache Hit Rate   | 95%    | ✅ Target    |

## Common Operations

### Database Connection

```bash
# Via Docker
docker exec -it ftry-postgres psql -U ftry -d ftry

# Direct connection
psql -U ftry -d ftry -h localhost -p 5432
```

### Schema Management

```bash
# Generate Prisma Client
bun prisma generate

# Create migration
bun prisma migrate dev --name descriptive_name

# Apply to production
bun prisma migrate deploy

# Check status
bun prisma migrate status

# Reset (DEV ONLY!)
bun prisma migrate reset
```

### Data Operations

```bash
# Seed database
bun prisma db seed

# Open database GUI
bun prisma studio  # http://localhost:5555
```

### Backup & Restore

```bash
# Manual backup
./scripts/backup-database.sh

# Restore from backup
pg_restore \
  --clean \
  --if-exists \
  -h localhost \
  -U ftry \
  -d ftry \
  backups/ftry_backup_YYYYMMDD_HHMMSS.dump

# Verify backup
pg_restore --list backups/ftry_backup_YYYYMMDD_HHMMSS.dump
```

## Performance Monitoring

### Slow Queries

```sql
-- Enable pg_stat_statements (run once)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  query,
  mean_exec_time as avg_ms,
  calls,
  total_exec_time as total_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Connection Usage

```sql
SELECT
  count(*) as active,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max,
  round((count(*)::float / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')) * 100, 2) as percent
FROM pg_stat_activity;
```

### Table Sizes

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || tablename) DESC;
```

### Index Usage

```sql
SELECT
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Row-Level Security (RLS)

### Check RLS Status

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### View RLS Policies

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

### Set Tenant Context

```sql
-- Set tenant (for manual queries)
SELECT set_tenant_context('tenant-id-here');

-- Clear context (super admin)
SELECT set_tenant_context(NULL);

-- Verify current context
SELECT current_setting('app.current_tenant_id', true);
```

## User Management

### List Users

```sql
SELECT id, email, "tenantId", "createdAt"
FROM "User"
WHERE "isDeleted" = false
ORDER BY "createdAt" DESC;
```

### Count Users per Tenant

```sql
SELECT
  t.name as tenant,
  COUNT(u.id) as users
FROM "Tenant" t
LEFT JOIN "User" u ON u."tenantId" = t.id AND u."isDeleted" = false
GROUP BY t.id, t.name
ORDER BY users DESC;
```

### Find Locked Accounts

```sql
SELECT id, email, "loginAttempts", "lockedUntil"
FROM "User"
WHERE "loginAttempts" >= 5
  AND "lockedUntil" > NOW();
```

### Unlock Account

```sql
UPDATE "User"
SET "loginAttempts" = 0, "lockedUntil" = NULL
WHERE email = 'user@example.com';
```

## Audit Trail

### Recent Logs

```sql
SELECT
  a.action,
  u.email,
  a."ipAddress",
  a."createdAt"
FROM "AuditLog" a
LEFT JOIN "User" u ON u.id = a."userId"
ORDER BY a."createdAt" DESC
LIMIT 50;
```

### Failed Logins

```sql
SELECT
  COUNT(*) as attempts,
  a."ipAddress",
  MAX(a."createdAt") as last_attempt
FROM "AuditLog" a
WHERE a.action = 'user.login'
  AND a.success = false
  AND a."createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY a."ipAddress"
HAVING COUNT(*) > 5
ORDER BY attempts DESC;
```

## Cache Operations

```typescript
// In NestJS code
import { CacheService } from '@ftry/backend/cache';

// Get from cache
const user = await this.cacheService.get<User>('user:123');

// Set with TTL
await this.cacheService.set('user:123', userData, 300); // 5 min

// Delete
await this.cacheService.del('user:123');

// Stats
const stats = this.cacheService.getStats();
console.log(`Cache hit rate: ${stats.hitRate}`);
```

## Maintenance

### Vacuum and Analyze

```sql
-- Run weekly
VACUUM ANALYZE;

-- Specific table
REINDEX TABLE "User";
```

### Clean Expired Tokens

```sql
-- Run daily
DELETE FROM "RefreshToken"
WHERE "expiresAt" < NOW() - INTERVAL '7 days';
```

### Check for Bloat

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) as total,
  pg_size_pretty(pg_relation_size('public.' || tablename)) as table,
  pg_size_pretty(pg_total_relation_size('public.' || tablename) - pg_relation_size('public.' || tablename)) as indexes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.' || tablename) DESC;
```

## Troubleshooting

### Connection Issues

```bash
# Check if running
docker ps | grep ftry-postgres

# Check logs
docker logs ftry-postgres

# Test connection
docker exec ftry-postgres pg_isready -U ftry

# Restart
docker compose restart postgres
```

### Performance Issues

```sql
-- Long-running queries
SELECT
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > INTERVAL '5 seconds'
ORDER BY duration DESC;

-- Kill stuck query
SELECT pg_terminate_backend(12345); -- Replace with actual PID
```

### RLS Issues

```sql
-- Empty results? Check tenant context
SELECT current_setting('app.current_tenant_id', true);

-- Temporarily disable RLS (DANGER!)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ... debug ...
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
```

### Migration Issues

```bash
# Check for drift
bun prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-database $DATABASE_URL

# Force resolve (if stuck)
bun prisma migrate resolve --applied YYYYMMDDHHMMSS_migration_name
```

## Health Checks

### Quick Health

```sql
SELECT
  'Database' as component,
  current_database() as name,
  pg_size_pretty(pg_database_size(current_database())) as size,
  (SELECT count(*) FROM pg_stat_activity) as connections,
  'OK' as status;
```

### Detailed Report

```bash
docker exec ftry-postgres psql -U ftry -d ftry -c "
SELECT 'Tables' as metric, COUNT(*)::text as value
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'Users', COUNT(*)::text FROM \"User\" WHERE \"isDeleted\" = false
UNION ALL
SELECT 'Connections', COUNT(*)::text FROM pg_stat_activity
UNION ALL
SELECT 'Size', pg_size_pretty(pg_database_size(current_database()));
"
```

## Emergency Procedures

### Database Not Responding

```bash
# Check container
docker ps | grep ftry-postgres

# Check logs
docker logs ftry-postgres --tail 100

# Restart
docker compose restart postgres

# Recreate if needed
docker compose down
docker compose up -d postgres
```

### Out of Connections

```sql
-- Check current
SELECT count(*) FROM pg_stat_activity;

-- Kill idle (>1 hour)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '1 hour';
```

### Accidental Deletion

```sql
-- Soft-deleted? Restore
UPDATE "User"
SET "isDeleted" = false, "deletedAt" = NULL
WHERE id = 'user-id';

-- Hard-deleted? Restore from backup
-- 1. Restore to temp database
-- 2. Export specific records
// 3. Import to production
```

## Best Practices

### Before Deployment

- [ ] Run migrations on staging first
- [ ] Test backup and restore
- [ ] Verify RLS policies active
- [ ] Check query performance (EXPLAIN ANALYZE)
- [ ] Review slow query log
- [ ] Validate connection pool config

### Daily Operations

- [ ] Monitor connection usage
- [ ] Check for long-running queries
- [ ] Review failed login attempts
- [ ] Verify backup completed
- [ ] Check disk space

### Weekly Maintenance

- [ ] Run VACUUM ANALYZE
- [ ] Clean expired tokens
- [ ] Review slow query stats
- [ ] Check index usage
- [ ] Audit user access

## Performance Benchmarks

| Operation               | Target   | Current | Status       |
| ----------------------- | -------- | ------- | ------------ |
| User login (cache hit)  | &lt;10ms | 2ms     | ✅ Excellent |
| User login (cache miss) | &lt;50ms | 15ms    | ✅ Good      |
| List users (tenant)     | &lt;50ms | 10ms    | ✅ Excellent |
| Token validation        | &lt;20ms | 5ms     | ✅ Excellent |
| Connection pool usage   | &lt;80%  | 10%     | ✅ Excellent |

## Related Documentation

- [Database Architecture](../architecture/database)
- [Backup & Restore Guide](./backup-restore)
- [RLS Implementation](../architecture/row-level-security)
