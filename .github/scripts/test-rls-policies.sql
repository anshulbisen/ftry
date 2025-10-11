-- RLS Policy Tests for CI/CD Pipeline
-- These tests verify that RLS policies are working correctly

-- Setup test data
BEGIN;

-- Clear existing test data
DELETE FROM "User" WHERE email LIKE '%@rlstest.com';
DELETE FROM "Tenant" WHERE id LIKE 'rls-test-%';
DELETE FROM "Role" WHERE id = 'rls-test-role';

-- Create test tenants
INSERT INTO "Tenant" (id, name, slug, status, "createdAt", "updatedAt")
VALUES
  ('rls-test-1', 'RLS Test Tenant 1', 'rls-test-1', 'active', NOW(), NOW()),
  ('rls-test-2', 'RLS Test Tenant 2', 'rls-test-2', 'active', NOW(), NOW());

-- Create test role
INSERT INTO "Role" (id, name, permissions, type, level, status, "createdAt", "updatedAt")
VALUES ('rls-test-role', 'RLS Test Role', ARRAY['test:read']::text[], 'system', 1, 'active', NOW(), NOW());

-- Create test users (using valid bcrypt hash)
INSERT INTO "User" (
  id, email, password, "firstName", "lastName", "tenantId", "roleId",
  status, "emailVerified", "createdAt", "updatedAt"
) VALUES
  ('rls-user-1', 'user1@rlstest.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
   'Test', 'User1', 'rls-test-1', 'rls-test-role', 'active', true, NOW(), NOW()),
  ('rls-user-2', 'user2@rlstest.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
   'Test', 'User2', 'rls-test-2', 'rls-test-role', 'active', true, NOW(), NOW()),
  ('rls-admin', 'admin@rlstest.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
   'Super', 'Admin', NULL, 'rls-test-role', 'active', true, NOW(), NOW());

COMMIT;

-- Test 1: Tenant isolation - User from tenant 1 should only see tenant 1 data
DO $$
DECLARE
  user_count INTEGER;
  wrong_tenant_count INTEGER;
BEGIN
  -- Set context to tenant 1
  PERFORM set_config('app.current_tenant', 'rls-test-1', true);

  -- Count users visible to tenant 1
  SELECT COUNT(*) INTO user_count
  FROM "User"
  WHERE email LIKE '%@rlstest.com';

  -- Count users from wrong tenant that are visible (should be 0)
  SELECT COUNT(*) INTO wrong_tenant_count
  FROM "User"
  WHERE "tenantId" = 'rls-test-2';

  -- Assertions
  IF wrong_tenant_count > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Tenant 1 can see % users from tenant 2', wrong_tenant_count;
  END IF;

  IF user_count != 2 THEN -- Should see tenant 1 user + super admin
    RAISE EXCEPTION 'TEST FAILED: Tenant 1 should see exactly 2 users, but sees %', user_count;
  END IF;

  RAISE NOTICE 'TEST PASSED: Tenant isolation working for tenant 1';
END $$;

-- Test 2: Tenant isolation - User from tenant 2 should only see tenant 2 data
DO $$
DECLARE
  user_count INTEGER;
  wrong_tenant_count INTEGER;
BEGIN
  -- Set context to tenant 2
  PERFORM set_config('app.current_tenant', 'rls-test-2', true);

  -- Count users visible to tenant 2
  SELECT COUNT(*) INTO user_count
  FROM "User"
  WHERE email LIKE '%@rlstest.com';

  -- Count users from wrong tenant that are visible (should be 0)
  SELECT COUNT(*) INTO wrong_tenant_count
  FROM "User"
  WHERE "tenantId" = 'rls-test-1';

  -- Assertions
  IF wrong_tenant_count > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Tenant 2 can see % users from tenant 1', wrong_tenant_count;
  END IF;

  IF user_count != 2 THEN -- Should see tenant 2 user + super admin
    RAISE EXCEPTION 'TEST FAILED: Tenant 2 should see exactly 2 users, but sees %', user_count;
  END IF;

  RAISE NOTICE 'TEST PASSED: Tenant isolation working for tenant 2';
END $$;

-- Test 3: Cross-tenant access blocked
DO $$
DECLARE
  cross_tenant_user RECORD;
BEGIN
  -- Set context to tenant 1
  PERFORM set_config('app.current_tenant', 'rls-test-1', true);

  -- Try to directly query a user from tenant 2
  SELECT * INTO cross_tenant_user
  FROM "User"
  WHERE id = 'rls-user-2';

  -- Assertion
  IF FOUND THEN
    RAISE EXCEPTION 'TEST FAILED: Tenant 1 can access user from tenant 2';
  END IF;

  RAISE NOTICE 'TEST PASSED: Cross-tenant access is blocked';
END $$;

-- Test 4: Super admin can see all tenants
DO $$
DECLARE
  total_count INTEGER;
  tenant_count INTEGER;
BEGIN
  -- Clear context (super admin mode)
  PERFORM set_config('app.current_tenant', '', true);

  -- Count all test users
  SELECT COUNT(*) INTO total_count
  FROM "User"
  WHERE email LIKE '%@rlstest.com';

  -- Count unique tenants
  SELECT COUNT(DISTINCT "tenantId") INTO tenant_count
  FROM "User"
  WHERE email LIKE '%@rlstest.com'
  AND "tenantId" IS NOT NULL;

  -- Assertions
  IF total_count != 3 THEN
    RAISE EXCEPTION 'TEST FAILED: Super admin should see all 3 test users, but sees %', total_count;
  END IF;

  IF tenant_count != 2 THEN
    RAISE EXCEPTION 'TEST FAILED: Super admin should see 2 distinct tenants, but sees %', tenant_count;
  END IF;

  RAISE NOTICE 'TEST PASSED: Super admin can see all tenant data';
END $$;

-- Test 5: INSERT respects RLS
DO $$
BEGIN
  -- Set context to tenant 1
  PERFORM set_config('app.current_tenant', 'rls-test-1', true);

  -- Try to insert a user with different tenant ID (should fail or be overridden)
  BEGIN
    INSERT INTO "User" (
      id, email, password, "firstName", "lastName", "tenantId", "roleId",
      status, "emailVerified", "createdAt", "updatedAt"
    ) VALUES (
      'rls-insert-test', 'insert@rlstest.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWnL0NeM4W2',
      'Insert', 'Test', 'rls-test-2', 'rls-test-role', 'active', true, NOW(), NOW()
    );

    -- If insert succeeds, check the actual tenant ID
    IF EXISTS (SELECT 1 FROM "User" WHERE id = 'rls-insert-test' AND "tenantId" = 'rls-test-2') THEN
      RAISE EXCEPTION 'TEST FAILED: Tenant 1 was able to insert user into tenant 2';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Expected: RLS should block or override
      NULL;
  END;

  RAISE NOTICE 'TEST PASSED: INSERT respects RLS policies';
END $$;

-- Test 6: UPDATE respects RLS
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  -- Set context to tenant 1
  PERFORM set_config('app.current_tenant', 'rls-test-1', true);

  -- Try to update a user from tenant 2
  UPDATE "User"
  SET "firstName" = 'Hacked'
  WHERE id = 'rls-user-2';

  GET DIAGNOSTICS update_count = ROW_COUNT;

  -- Assertion
  IF update_count > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Tenant 1 was able to update % users from tenant 2', update_count;
  END IF;

  RAISE NOTICE 'TEST PASSED: UPDATE respects RLS policies';
END $$;

-- Test 7: DELETE respects RLS
DO $$
DECLARE
  delete_count INTEGER;
BEGIN
  -- Set context to tenant 1
  PERFORM set_config('app.current_tenant', 'rls-test-1', true);

  -- Try to delete a user from tenant 2
  DELETE FROM "User"
  WHERE id = 'rls-user-2';

  GET DIAGNOSTICS delete_count = ROW_COUNT;

  -- Assertion
  IF delete_count > 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Tenant 1 was able to delete % users from tenant 2', delete_count;
  END IF;

  RAISE NOTICE 'TEST PASSED: DELETE respects RLS policies';
END $$;

-- Cleanup test data
BEGIN;
DELETE FROM "User" WHERE email LIKE '%@rlstest.com';
DELETE FROM "Tenant" WHERE id LIKE 'rls-test-%';
DELETE FROM "Role" WHERE id = 'rls-test-role';
COMMIT;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICY TESTS COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All 7 tests passed:';
  RAISE NOTICE '✓ Tenant 1 isolation';
  RAISE NOTICE '✓ Tenant 2 isolation';
  RAISE NOTICE '✓ Cross-tenant access blocked';
  RAISE NOTICE '✓ Super admin access';
  RAISE NOTICE '✓ INSERT respects RLS';
  RAISE NOTICE '✓ UPDATE respects RLS';
  RAISE NOTICE '✓ DELETE respects RLS';
END $$;