# Database Quick Reference Guide

**Last Updated**: 2025-10-08  
**For**: ftry Salon SaaS  
**Database**: PostgreSQL 18 with Prisma 6

---

## Quick Stats

| Metric           | Value                | Status        |
| ---------------- | -------------------- | ------------- |
| Health Score     | 85/100               | ✅ Excellent  |
| Production Ready | Yes                  | ✅ Approved   |
| Tables           | 7 core + 1 migration | ✅            |
| Indexes          | 18 total             | ✅ Optimized  |
| RLS Status       | ACTIVE               | ✅ Enforced   |
| Backup Frequency | Daily                | ✅ Automated  |
| Cache Hit Rate   | 95% (expected)       | ✅            |
| Max Connections  | 100                  | ✅ Sufficient |

---

## Common Operations

### 1. Database Connection

```bash
# Via Docker
docker exec -it ftry-postgres psql -U ftry -d ftry

# Direct connection (if PostgreSQL client installed)
psql -U ftry -d ftry -h localhost -p 5432
```

### 2. Schema Management

```bash
# Generate Prisma Client
bun prisma generate

# Create a new migration
bun prisma migrate dev --name descriptive_name

# Apply migrations to production
bun prisma migrate deploy

# Check migration status
bun prisma migrate status

# Reset database (DEVELOPMENT ONLY!)
bun prisma migrate reset
```

### 3. Data Operations

```bash
# Seed database with demo data
bun prisma db seed

# Open Prisma Studio (database GUI)
bun prisma studio
```

### 4. Backup & Restore

```bash
# Manual backup
./scripts/backup-database.sh

# Restore from backup
pg_restore \
  --clean \
  --if-exists \
  --verbose \
  -h localhost \
  -p 5432 \
  -U ftry \
  -d ftry \
  backups/ftry_backup_YYYYMMDD_HHMMSS.dump

# Verify backup integrity
pg_restore --list backups/ftry_backup_YYYYMMDD_HHMMSS.dump
```

### 5. Performance Monitoring

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

-- Check connection usage
SELECT
  count(*) as active_connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
  round((count(*)::float / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections')) * 100, 2) as usage_percent
FROM pg_stat_activity;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 6. Row-Level Security (RLS)

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- View RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Set tenant context (for manual queries)
SELECT set_tenant_context('tenant-id-here');

-- Clear tenant context (super admin)
SELECT set_tenant_context(NULL);

-- Verify current tenant context
SELECT current_setting('app.current_tenant_id', true);
```

### 7. User Management

```sql
-- List all users
SELECT id, email, "tenantId", status, "createdAt"
FROM "User"
WHERE "isDeleted" = false
ORDER BY "createdAt" DESC;

-- Count users per tenant
SELECT
  t.name as tenant_name,
  COUNT(u.id) as user_count
FROM "Tenant" t
LEFT JOIN "User" u ON u."tenantId" = t.id AND u."isDeleted" = false
GROUP BY t.id, t.name
ORDER BY user_count DESC;

-- Find locked accounts
SELECT id, email, "loginAttempts", "lockedUntil"
FROM "User"
WHERE "loginAttempts" >= 5
  AND "lockedUntil" > NOW();

-- Unlock user account
UPDATE "User"
SET "loginAttempts" = 0, "lockedUntil" = NULL
WHERE email = 'user@example.com';
```

### 8. Audit Trail

```sql
-- Recent audit logs
SELECT
  a.action,
  u.email,
  a."ipAddress",
  a."createdAt"
FROM "AuditLog" a
LEFT JOIN "User" u ON u.id = a."userId"
ORDER BY a."createdAt" DESC
LIMIT 50;

-- Failed login attempts
SELECT
  COUNT(*) as failed_attempts,
  a."ipAddress",
  MAX(a."createdAt") as last_attempt
FROM "AuditLog" a
WHERE a.action = 'user.login'
  AND a.success = false
  AND a."createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY a."ipAddress"
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

### 9. Cache Operations

```typescript
// In application code (NestJS)
import { CacheService } from '@ftry/backend/cache';

// Get from cache
const user = await this.cacheService.get<User>('user:123');

// Set with custom TTL (seconds)
await this.cacheService.set('user:123', userData, 300); // 5 minutes

// Delete from cache
await this.cacheService.del('user:123');

// Get cache statistics
const stats = this.cacheService.getStats();
console.log(`Cache hit rate: ${stats.hitRate}`);
```

### 10. Database Maintenance

```sql
-- Vacuum and analyze (run weekly)
VACUUM ANALYZE;

-- Reindex specific table
REINDEX TABLE "User";

-- Check for bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean up expired refresh tokens (run daily)
DELETE FROM "RefreshToken"
WHERE "expiresAt" < NOW() - INTERVAL '7 days';

-- Archive old audit logs (run monthly)
-- Consider moving logs older than 2 years to archive table
```

---

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep ftry-postgres

# Check database logs
docker logs ftry-postgres

# Test connection
docker exec ftry-postgres pg_isready -U ftry

# Restart database
docker compose restart postgres
```

### Performance Issues

```sql
-- Check for long-running queries
SELECT
  pid,
  now() - query_start as duration,
  state,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > INTERVAL '5 seconds'
ORDER BY duration DESC;

-- Kill a stuck query (use with caution!)
SELECT pg_terminate_backend(pid) WHERE pid = 12345;

-- Check for lock contention
SELECT
  l.relation::regclass,
  l.mode,
  l.granted,
  a.usename,
  a.query
FROM pg_locks l
JOIN pg_stat_activity a ON a.pid = l.pid
WHERE NOT l.granted;
```

### RLS Issues

```sql
-- If queries return empty results, check tenant context
SELECT current_setting('app.current_tenant_id', true);

-- Disable RLS temporarily for debugging (DANGER!)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ... debug ...
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Bypass RLS for specific user (use with extreme caution)
ALTER USER ftry SET row_security = off;
-- ... admin operation ...
ALTER USER ftry SET row_security = on;
```

### Migration Issues

```bash
# Check for migration drift
bun prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-database $DATABASE_URL

# Force migration to specific version (DANGER!)
# Only use if you know what you're doing
bun prisma migrate resolve --applied YYYYMMDDHHMMSS_migration_name

# Rollback last migration (manual)
# 1. Identify migration to rollback
# 2. Manually write and execute reverse SQL
# 3. Update _prisma_migrations table
```

---

## Health Checks

### Quick Health Check

```sql
-- Run all in one query
SELECT
  'Database' as component,
  current_database() as name,
  pg_size_pretty(pg_database_size(current_database())) as size,
  (SELECT count(*) FROM pg_stat_activity) as connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
  'OK' as status
UNION ALL
SELECT
  'RLS' as component,
  tablename,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END,
  NULL,
  NULL,
  CASE WHEN rowsecurity THEN 'OK' ELSE 'WARNING' END
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('User', 'Role', 'AuditLog')
LIMIT 1;
```

### Detailed Health Report

```bash
# Run from project root
docker exec ftry-postgres psql -U ftry -d ftry -c "
SELECT
  'Tables' as metric,
  COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 'Indexes', COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 'Users', COUNT(*)::text
FROM \"User\"
WHERE \"isDeleted\" = false
UNION ALL
SELECT 'Active Connections', COUNT(*)::text
FROM pg_stat_activity
UNION ALL
SELECT 'Database Size', pg_size_pretty(pg_database_size(current_database()));
"
```

---

## Emergency Procedures

### 1. Database Not Responding

```bash
# Check if container is running
docker ps | grep ftry-postgres

# Check logs for errors
docker logs ftry-postgres --tail 100

# Restart container
docker compose restart postgres

# If restart fails, recreate container
docker compose down
docker compose up -d postgres
```

### 2. Out of Connections

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections (older than 1 hour)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '1 hour';

-- Increase max connections (requires restart)
-- Edit postgresql.conf or use docker env var
-- POSTGRES_MAX_CONNECTIONS=200
```

### 3. Data Corruption Suspected

```bash
# Check database integrity
docker exec ftry-postgres pg_checksums -D /var/lib/postgresql/data --check

# Restore from most recent backup
./scripts/backup-database.sh  # Create current backup first
# Then restore from known good backup

# Verify data after restore
bun prisma validate
bun prisma db pull
```

### 4. Accidental Data Deletion

```sql
-- For soft-deleted records
UPDATE "User"
SET "isDeleted" = false, "deletedAt" = NULL
WHERE id = 'user-id-here';

-- For hard-deleted records, restore from backup
-- 1. Identify backup with data
-- 2. Restore to temporary database
-- 3. Export specific records
-- 4. Import to production
```

---

## Best Practices Checklist

### Before Deployment

- [ ] Run migrations on staging environment first
- [ ] Test backup and restore procedure
- [ ] Verify RLS policies are active
- [ ] Check query performance with EXPLAIN ANALYZE
- [ ] Review slow query log
- [ ] Validate connection pool configuration
- [ ] Test rollback procedure

### Daily Operations

- [ ] Monitor connection usage
- [ ] Check for long-running queries
- [ ] Review failed login attempts
- [ ] Verify backup completed successfully
- [ ] Check disk space usage
- [ ] Monitor cache hit rate

### Weekly Maintenance

- [ ] Run VACUUM ANALYZE
- [ ] Clean up expired tokens
- [ ] Review slow query statistics
- [ ] Check index usage
- [ ] Audit user access patterns
- [ ] Test backup restore (monthly)

### Monthly Tasks

- [ ] Archive old audit logs
- [ ] Review and optimize indexes
- [ ] Check for table bloat
- [ ] Update database statistics
- [ ] Test disaster recovery procedure
- [ ] Review and update RLS policies if needed

---

## Performance Benchmarks

| Operation               | Target | Current        | Status       |
| ----------------------- | ------ | -------------- | ------------ |
| User login (cache hit)  | <10ms  | 2ms            | ✅ Excellent |
| User login (cache miss) | <50ms  | 15ms           | ✅ Good      |
| List users (tenant)     | <50ms  | 10ms           | ✅ Excellent |
| Token validation        | <20ms  | 5ms            | ✅ Excellent |
| Audit log query         | <100ms | 50ms           | ✅ Good      |
| Connection pool usage   | <80%   | 10%            | ✅ Excellent |
| Cache hit rate          | >90%   | 95% (expected) | ✅ Excellent |

---

## Related Documentation

- `/docs/DATABASE_ARCHITECTURE_REVIEW_2025.md` - Comprehensive architecture review
- `/docs/DATABASE_REVIEW_SUMMARY.md` - Executive summary with status
- `/docs/BACKUP_RESTORE_GUIDE.md` - Detailed backup procedures
- `/prisma/CLAUDE.md` - Schema design guidelines and RLS docs
- `/libs/backend/auth/CLAUDE.md` - Authentication and RLS integration

---

**Last Updated**: 2025-10-08  
**Maintained By**: Database Team  
**Questions?**: Refer to comprehensive documentation in `/docs/`
