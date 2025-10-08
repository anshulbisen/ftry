-- ==================== ROW-LEVEL SECURITY (RLS) SETUP SCRIPT ====================
-- Standalone script to enable RLS on existing databases
--
-- Use this script when:
-- 1. Migrating existing production database to RLS
-- 2. RLS was accidentally disabled
-- 3. Setting up database without Prisma migrations
--
-- Usage:
--   psql $DATABASE_URL -f prisma/scripts/setup-rls.sql
--
-- IMPORTANT: Test in staging environment first!
-- IMPORTANT: Application MUST set tenant context after enabling RLS
-- ============================================================================

-- Step 1: Enable RLS on all tenant-scoped tables
DO $$
BEGIN
  RAISE NOTICE '🔐 Enabling Row-Level Security...';
  
  ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS enabled on User table';
  
  ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS enabled on Role table';
  
  ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS enabled on AuditLog table';
  
  ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS enabled on RefreshToken table';
  
  ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE '✅ RLS enabled on Session table';
END $$;

-- Step 2: Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "User";
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "Role";
DROP POLICY IF EXISTS "tenant_isolation_policy" ON "AuditLog";
DROP POLICY IF EXISTS "user_isolation_policy" ON "RefreshToken";
DROP POLICY IF EXISTS "user_isolation_policy" ON "Session";

-- Step 3: Create RLS policies
CREATE POLICY "tenant_isolation_policy" ON "User"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
  );

CREATE POLICY "tenant_isolation_policy" ON "Role"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
  );

CREATE POLICY "tenant_isolation_policy" ON "AuditLog"
  FOR ALL
  USING (
    "tenantId" IS NULL
    OR "tenantId" = current_setting('app.current_tenant_id', true)::TEXT
  );

CREATE POLICY "user_isolation_policy" ON "RefreshToken"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = "RefreshToken"."userId"
        AND (
          "User"."tenantId" IS NULL
          OR "User"."tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        )
    )
  );

CREATE POLICY "user_isolation_policy" ON "Session"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = "Session"."userId"
        AND (
          "User"."tenantId" IS NULL
          OR "User"."tenantId" = current_setting('app.current_tenant_id', true)::TEXT
        )
    )
  );

-- Step 4: Create helper function
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  IF tenant_id IS NULL THEN
    PERFORM set_config('app.current_tenant_id', '', false);
  ELSIF tenant_id ~ '^[a-zA-Z0-9_-]+$' THEN
    PERFORM set_config('app.current_tenant_id', tenant_id, false);
  ELSE
    RAISE EXCEPTION 'Invalid tenant_id format: %', tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verification
DO $$
DECLARE
  tables_with_rls INT;
  policies_created INT;
BEGIN
  RAISE NOTICE '🔍 Verifying RLS setup...';
  
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  SELECT COUNT(*) INTO policies_created
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Tables with RLS enabled: %', tables_with_rls;
  RAISE NOTICE '✅ Policies created: %', policies_created;
  
  IF tables_with_rls = 5 AND policies_created = 5 THEN
    RAISE NOTICE '🎉 Row-Level Security setup complete!';
  ELSE
    RAISE WARNING '⚠️  Expected 5 tables and 5 policies. Please verify manually.';
  END IF;
END $$;

-- Display RLS status
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled",
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = pt.tablename) as "Policies"
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;
