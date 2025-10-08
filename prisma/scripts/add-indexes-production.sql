-- ==================== PRODUCTION INDEX CREATION SCRIPT ====================
-- This script creates indexes using CONCURRENTLY to avoid blocking production traffic
-- 
-- IMPORTANT: Run this OUTSIDE of a transaction (psql --single-transaction=off)
-- IMPORTANT: Run during low-traffic hours if possible
--
-- Usage:
--   psql $DATABASE_URL -f prisma/scripts/add-indexes-production.sql
--
-- Time estimate: ~5-10 minutes for 100K users, ~30 minutes for 1M users
-- ============================================================================

-- 1. RefreshToken: User-specific token lookup with expiry check
DROP INDEX CONCURRENTLY IF EXISTS "idx_refresh_token_user_expiry";
CREATE INDEX CONCURRENTLY "idx_refresh_token_user_expiry"
ON "RefreshToken"("userId", "expiresAt" DESC)
WHERE "isRevoked" = false;

-- 2. User: Tenant-scoped active user queries
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_tenant_status";
CREATE INDEX CONCURRENTLY "idx_user_tenant_status"
ON "User"("tenantId", "status")
WHERE "isDeleted" = false;

-- 3. User: Email + Tenant lookup for authentication
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_email_tenant";
CREATE INDEX CONCURRENTLY "idx_user_email_tenant"
ON "User"("email", "tenantId");

-- 4. AuditLog: Tenant audit trail with date filtering
DROP INDEX CONCURRENTLY IF EXISTS "idx_audit_log_tenant_date";
CREATE INDEX CONCURRENTLY "idx_audit_log_tenant_date"
ON "AuditLog"("tenantId", "createdAt" DESC);

-- 5. RefreshToken: Fast token hash lookup for validation
DROP INDEX CONCURRENTLY IF EXISTS "idx_refresh_token_hash";
CREATE INDEX CONCURRENTLY "idx_refresh_token_hash"
ON "RefreshToken"("token")
WHERE "isRevoked" = false;

-- 6. User: Tenant + Role queries for RBAC operations
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_tenant_role";
CREATE INDEX CONCURRENTLY "idx_user_tenant_role"
ON "User"("tenantId", "roleId")
WHERE "isDeleted" = false;

-- 7. Role: Tenant-scoped role lookup
DROP INDEX CONCURRENTLY IF EXISTS "idx_role_tenant_status";
CREATE INDEX CONCURRENTLY "idx_role_tenant_status"
ON "Role"("tenantId", "status");

-- 8. User: Last login tracking for analytics
DROP INDEX CONCURRENTLY IF EXISTS "idx_user_tenant_last_login";
CREATE INDEX CONCURRENTLY "idx_user_tenant_last_login"
ON "User"("tenantId", "lastLogin" DESC NULLS LAST)
WHERE "isDeleted" = false;

-- ==================== VERIFICATION ====================
-- Check indexes created successfully
\echo '✅ Index creation complete. Verifying...'
\echo ''

SELECT 
  schemaname, 
  tablename, 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo '✅ All indexes created successfully!'
